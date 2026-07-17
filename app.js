/* Dashboard IEIE · FFIE 2026 — v3. LOOP 3: Resumen + Análisis del IEIE + Metodología.
   Estático, sin backend. Todas las cifras provienen de data/*.json validados (LOOP 1). */
(function () {
  "use strict";
  var NC = 999, ETA = "No calculable";
  var DIMS = ["D1","D2","D3","D4","D5","D6","D7","D8","D9"];
  var CATS = ["Adecuado","Aceptable","Deficiente","Crítico"];
  var CAT_COLOR = {Adecuado:"#2f9e8f",Aceptable:"#7cc0a8",Deficiente:"#e0a253","Crítico":"#d0594e","Critico":"#d0594e"};
  var PURPLE="#3a1354", MAGENTA="#d6486e", TEAL="#2f9e8f", AMBER="#e0a253", BLUE="#4e79b8";
  var $=function(s,c){return (c||document).querySelector(s);};
  var $$=function(s,c){return [].slice.call((c||document).querySelectorAll(s));};

  var D={}, dimLbl={}, geo=null, map=null, geoLayer=null, insetMap=null, insetLayer=null;
  var charts={}, radarChart=null;
  var map2=null, geoM=null, mgeo=null, m2Layer=null, m2Inset=null, m2InsetMap=null, m2State={capa:"ieie",nivel:"departamental",vari:"agua_continua"};
  var state={dep:"", mpio:"", zona:"total", cob:"", dim:"", vari:"", cat:""};

  function num(v){ if(v===null||v===undefined||v==="")return null; var n=+v; return (isNaN(n)||n===NC)?null:n; }
  function fmt(v,d){ var n=num(v); return n===null?"—":n.toLocaleString("es",{minimumFractionDigits:d||0,maximumFractionDigits:d===undefined?2:d}); }
  function fmtInt(v){ var n=num(v); return n===null?"—":Math.round(n).toLocaleString("es"); }
  function pct(v){ var n=num(v); return n===null?"—":n.toLocaleString("es",{maximumFractionDigits:1})+"%"; }
  function catOf(ieie){ var v=num(ieie); if(v===null)return null; if(v<40)return "Crítico"; if(v<60)return "Deficiente"; if(v<80)return "Aceptable"; return "Adecuado"; }
  function dimName(c){ return c?(c+(dimLbl[c]?" · "+dimLbl[c]:"")):"—"; }

  function boot(){
    var files=["resumen_nacional","resumen_departamental","resumen_municipal","perfil_dimensiones",
      "resultados_rural_urbano","suficiencia_muestral","glosario_dimensiones","variables_tematicas","variables_detalle","config_mapas","variables_numericas","metadata_variables"];
    Promise.all(files.map(function(f){return fetch("data/"+f+".json").then(function(r){
      if(!r.ok)throw new Error(f+" ("+r.status+")"); return r.json();});})
      .concat([fetch("geo/departamentos.geojson").then(function(r){return r.json();})]))
    .then(function(res){
      D.nac=res[0]; D.deps=res[1]; D.munis=res[2]; D.perfil=res[3];
      D.ru=res[4]; D.suf=res[5]; D.glos=res[6]; D.vtem=res[7]; D.vdet=res[8]; D.cfg=res[9]; D.vnum=res[10]; D.metaVars=res[11]; geo=res[12];
      D.muniByCod={}; D.munis.forEach(function(m){ D.muniByCod[m.mpio_cod]=m; });
      D.perfil.dimensiones.forEach(function(d){ dimLbl[d.codigo]=d.etiqueta; });
      D.depByCod={}; D.deps.forEach(function(d){ D.depByCod[d.cod]=d; });
      init();
    }).catch(function(e){
      $("#brand-meta").textContent="Error al cargar datos: "+e.message;
      console.error(e);
    });
  }

  function init(){
    var n=D.nac;
    $("#brand-meta").innerHTML=fmtInt(n.muestra_valida)+" sedes válidas · "+n.cobertura_territorial+" · IEIE "+fmt(n.ieie_nacional,2);
    // selector departamentos (por nombre, orden alfabético; value = cod)
    var sel=$("#dep-select");
    D.deps.slice().sort(function(a,b){return a.nombre.localeCompare(b.nombre,"es");})
      .forEach(function(d){ var o=document.createElement("option"); o.value=d.cod; o.textContent=d.nombre; sel.appendChild(o); });
    sel.addEventListener("change",function(){ state.dep=sel.value; state.mpio=""; poblarMunicipios(); render(); });
    $("#mpio-select").addEventListener("change",function(){ state.mpio=this.value; render(); });
    $("#zona-select").addEventListener("change",function(){ state.zona=this.value; render(); });
    $("#btn-reset").addEventListener("click",resetAll);
    $("#btn-map-reset").addEventListener("click",function(){ resetAll(); if(map)map.setView([4.6,-73.2],5); });
    $$(".tab").forEach(function(t){ t.addEventListener("click",function(){ activar(t.dataset.tab); }); });
    $("#btn-toggle-radar").addEventListener("click",toggleRadar);

    construirGlosario(); construirMetodologia(); construirFichaSelectores(); construirExplorador();
    // Botón Geovisor: destino centralizado (si en el futuro es una URL ArcGIS, se cambia aquí o en config_mapas.json)
    var GEOVISOR_TARGET = (D.cfg && D.cfg.geovisor_target) ? D.cfg.geovisor_target : "mapas";
    $("#btn-geovisor").addEventListener("click",function(){
      if(/^https?:\/\//.test(GEOVISOR_TARGET)) window.open(GEOVISOR_TARGET,"_blank","noopener");
      else activar(GEOVISOR_TARGET);
    });
    var bm=$("#btn-ir-metodologia"); if(bm)bm.addEventListener("click",function(){ activar("metodologia"); });
    var corte=D.nac.corte||""; $("#corte-nota").textContent = corte?("Corte de información: "+corte):"Fuente: encuesta FFIE 2026 (base consolidada).";
    render();
    initMapa();
    construirMapasInteractivos();
    window.addEventListener("resize",function(){ Object.keys(charts).forEach(function(k){charts[k]&&charts[k].resize();}); radarChart&&radarChart.resize(); if(map)map.invalidateSize(); if(insetMap)insetMap.invalidateSize(); });
  }

  function ctx(){ return state.dep?D.depByCod[state.dep]:null; }
  function ctxMpio(){ if(!state.mpio)return null; return D.munis.filter(function(m){return m.mpio_cod===state.mpio;})[0]||null; }

  function poblarMunicipios(){
    var msel=$("#mpio-select");
    msel.innerHTML='<option value="">Todos los municipios</option>';
    var c=ctx();
    if(!c){ msel.disabled=true; msel.hidden=true; return; }
    var ms=D.munis.filter(function(m){return m.departamento===c.nombre && m.muestra_valida>0;})
      .sort(function(a,b){return a.nombre.localeCompare(b.nombre,"es");});
    if(ms.length){ ms.forEach(function(m){ var o=document.createElement("option"); o.value=m.mpio_cod; o.textContent=m.nombre+" · n="+m.muestra_valida; msel.appendChild(o); });
      msel.disabled=false; msel.hidden=false; }
    else { msel.disabled=true; msel.hidden=true; }
  }

  function activar(tab){
    $$(".tab").forEach(function(t){ var on=t.dataset.tab===tab; t.classList.toggle("is-active",on); t.setAttribute("aria-selected",on?"true":"false"); });
    $$(".panel").forEach(function(p){ var on=p.id==="panel-"+tab; p.classList.toggle("is-active",on); p.hidden=!on; });
    $("#grp-cobertura").hidden = true;
    setTimeout(function(){ Object.keys(charts).forEach(function(k){charts[k]&&charts[k].resize();}); radarChart&&radarChart.resize(); if(map&&tab==="resumen")map.invalidateSize(); if(map2&&tab==="mapas")map2.invalidateSize(); },30);
  }

  function resetAll(){
    state.dep=""; state.mpio=""; state.zona="total";
    $("#dep-select").value=""; $("#zona-select").value="total"; poblarMunicipios();
    render(); resaltarMapa();
  }

  /* ---------- RENDER MAESTRO ---------- */
  function render(){
    $("#btn-reset").hidden = !(state.dep||state.mpio||state.zona!=="total");
    var c=ctx(), m=ctxMpio();
    var nombre = m?m.nombre:(c?c.nombre:"Colombia");
    var sub = m?("en "+c.nombre):(c?(c.es_distrito_capital?"Distrito Capital":"Departamento"):"Total nacional");
    $("#scope-name").textContent=nombre; $("#scope-sub").textContent=sub;
    $("#filter-hint").textContent = c?("Filtrando por "+nombre+(state.zona!=="total"?(" · zona "+state.zona):"")):"Vista nacional. Elige un ámbito o haz clic en el mapa.";
    pintarKPIs(); pintarRanking(); pintarRuralUrbano(); pintarDistribucion(); pintarCaution(); pintarNotas();
    pintarAnalisis(); pintarFicha();
    resaltarMapa();
  }

  function ieiePorZona(obj){ // obj = nac o depto
    if(state.zona==="urbano") return obj.ieie_urbano!==undefined?obj.ieie_urbano:obj.ieie;
    if(state.zona==="rural") return obj.ieie_rural!==undefined?obj.ieie_rural:obj.ieie;
    return obj.ieie!==undefined?obj.ieie:obj.ieie_nacional;
  }

  function ech(id){ if(!charts[id])charts[id]=echarts.init($("#"+id),null,{renderer:"canvas"}); return charts[id]; }

  /* ---------- KPIs ---------- */
  function pintarKPIs(){
    var c=ctx(), m=ctxMpio();
    var marco,muestra,cob,ieie,crit,critLbl,suf;
    if(m){ marco=m.marco_sedes; muestra=m.muestra_valida; cob=m.cobertura_pct; ieie=m.ieie; crit="—"; critLbl=""; suf=m.suficiencia; }
    else if(c){ marco=c.marco_sedes; muestra=c.muestra_valida; cob=c.cobertura_pct; ieie=ieiePorZona(c); crit=c.dim_critica; critLbl=dimLbl[c.dim_critica]||""; suf=c.suficiencia; }
    else { var n=D.nac; marco=n.marco_total_sedes; muestra=n.muestra_valida; cob=n.cobertura_pct; ieie=ieiePorZona(n);
      // dim crítica nacional = menor promedio
      var arr=DIMS.map(function(d){return [d,num(n.dim_prom[d])];}).filter(function(x){return x[1]!==null;}).sort(function(a,b){return a[1]-b[1];});
      crit=arr[0][0]; critLbl=dimLbl[crit]||""; suf="suficiente"; }
    $("#kpi-marco").textContent=fmtInt(marco);
    $("#kpi-muestra").textContent=fmtInt(muestra);
    $("#kpi-cobertura").textContent=pct(cob);
    $("#kpi-ieie").textContent=fmt(ieie,2);
    var cat=catOf(ieie); $("#kpi-ieie-cat").textContent=cat?(cat+" · escala 0–100"):"escala 0–100";
    $("#kpi-critica").textContent=crit||"—"; $("#kpi-critica-lbl").textContent=critLbl;
    var chip=$("#chip-suf");
    if(suf==="insuficiente"){ chip.hidden=false; chip.className="chip-suf warn"; chip.textContent="⚠ Muestra insuficiente — estimación con precaución"; }
    else { chip.hidden=false; chip.className="chip-suf ok"; chip.textContent="✔ Suficiencia muestral adecuada"; }
  }

  /* ---------- Ranking ---------- */
  function pintarRanking(){
    var c=ctx();
    var r=D.deps.slice().filter(function(d){return num(d.ieie)!==null;}).sort(function(a,b){return a.ieie-b.ieie;});
    ech("chart-ranking").setOption({
      grid:{left:8,right:34,top:6,bottom:6,containLabel:true},
      tooltip:{trigger:"axis",axisPointer:{type:"shadow"},
        formatter:function(p){var d=r[p[0].dataIndex];return d.nombre+"<br/>IEIE "+fmt(d.ieie,2)+" · "+d.categoria_modal+"<br/>muestra "+fmtInt(d.muestra_valida)+(d.suficiencia==="insuficiente"?" (insuficiente)":"");}},
      xAxis:{type:"value",min:0,max:100,axisLabel:{fontSize:11}},
      yAxis:{type:"category",data:r.map(function(d){return d.nombre;}),axisLabel:{fontSize:10,color:"#574c63"}},
      series:[{type:"bar",data:r.map(function(d){
        var isSel=c&&d.cod===c.cod;
        return {value:+d.ieie.toFixed(2),itemStyle:{
          color:isSel?MAGENTA:(d.suficiencia==="insuficiente"?"#c9bcd6":"#b79dc9"),
          decal:d.suficiencia==="insuficiente"?{symbol:"line",dashArrayX:[1,0],dashArrayY:[2,3],rotation:-Math.PI/4,color:"rgba(255,255,255,.55)"}:null,
          borderRadius:[0,4,4,0]}};
      }),barMaxWidth:13,label:{show:true,position:"right",fontSize:9.5,formatter:function(p){return p.value.toFixed(1);},color:"#574c63"}}]
    },true);
  }

  /* ---------- Rural-urbano ---------- */
  function pintarRuralUrbano(){
    var c=ctx(), base=c||{ieie_urbano:D.nac.ieie_urbano,ieie_rural:D.nac.ieie_rural};
    var natU=D.nac.ieie_urbano, natR=D.nac.ieie_rural;
    ech("chart-ru").setOption({
      grid:{left:8,right:20,top:30,bottom:6,containLabel:true},
      legend:{data:[c?"Territorio":"Nacional","Referente nacional"],top:0,textStyle:{fontSize:11},show:!!c},
      tooltip:{trigger:"axis",valueFormatter:function(v){return v==null?ETA:(+v).toFixed(2);}},
      xAxis:{type:"category",data:["Urbana","Rural"],axisLabel:{fontSize:12}},
      yAxis:{type:"value",min:0,max:100,axisLabel:{fontSize:11}},
      series: c ? [
        {name:"Territorio",type:"bar",data:[num(c.ieie_urbano),num(c.ieie_rural)],barMaxWidth:38,itemStyle:{color:MAGENTA,borderRadius:[4,4,0,0]},label:{show:true,position:"top",fontSize:11,formatter:function(p){return p.value==null?ETA:p.value.toFixed(1);}}},
        {name:"Referente nacional",type:"line",data:[natU,natR],symbol:"diamond",symbolSize:11,itemStyle:{color:PURPLE},lineStyle:{type:"dashed",color:PURPLE}}
      ] : [
        {name:"Nacional",type:"bar",data:[natU,natR],barMaxWidth:60,itemStyle:{color:function(p){return p.dataIndex===0?BLUE:AMBER;},borderRadius:[4,4,0,0]},label:{show:true,position:"top",fontSize:12,formatter:function(p){return p.value.toFixed(1);}}}
      ]
    },true);
  }

  /* ---------- Distribución (barras apiladas 100%) ---------- */
  function pintarDistribucion(){
    var c=ctx(), dist=c?c.dist_categoria:D.nac.dist_categoria;
    var total=CATS.reduce(function(s,k){return s+(dist[k]||dist[k==="Crítico"?"Critico":k]||0);},0)||1;
    var series=CATS.map(function(k){
      var val=dist[k]||dist[k==="Crítico"?"Critico":k]||0;
      return {name:k,type:"bar",stack:"t",data:[+(100*val/total).toFixed(1)],
        itemStyle:{color:CAT_COLOR[k]},barMaxWidth:38,
        label:{show:(val/total)>=0.06,formatter:function(p){return p.value+"%";},fontSize:11,color:"#fff",fontWeight:700},
        tooltip:{valueFormatter:function(v){return v+"% ("+fmtInt(val)+" sedes)";}}};
    });
    ech("chart-dist").setOption({
      grid:{left:8,right:12,top:8,bottom:4,containLabel:true},
      legend:{data:CATS,bottom:0,textStyle:{fontSize:11}},
      tooltip:{trigger:"item"},
      xAxis:{type:"value",max:100,show:false},
      yAxis:{type:"category",data:[""],axisLabel:{show:false},axisTick:{show:false},axisLine:{show:false}},
      series:series
    },true);
  }

  /* ---------- Caution + notas ---------- */
  function pintarCaution(){
    var c=ctx(), m=ctxMpio(); var box=$("#caution-box"); var ins=null;
    if(m&&m.suficiencia==="insuficiente")ins=m.nombre;
    else if(c&&c.suficiencia==="insuficiente")ins=c.nombre;
    if(ins){ box.hidden=false;
      box.innerHTML="<b>Precaución — muestra insuficiente.</b> El ámbito seleccionado ("+ins+") tiene menos de "+D.suf.umbral+" sedes con encuesta válida. Su IEIE debe leerse como <b>estimación con precaución</b>, no como una inferencia concluyente."; }
    else box.hidden=true;
  }
  function pintarNotas(){
    var n=D.nac;
    $("#notas-resumen").innerHTML="El IEIE y las categorías provienen de las tablas oficiales del índice (no se recalculan). "+
      "Cobertura = muestra válida ("+fmtInt(n.muestra_valida)+") sobre el marco poblacional ("+fmtInt(n.marco_total_sedes)+" sedes). "+
      "Se excluyen "+n.atipicos_excluidos+" registros atípicos y el código 999 (No calculable). Cobertura territorial: "+n.cobertura_territorial+".";
  }

  /* ---------- ANÁLISIS DEL IEIE ---------- */
  function pintarAnalisis(){
    var c=ctx();
    $("#an-scope").textContent=c?c.nombre:"Nacional";
    var terr=c?c.dim_prom:null, nacD=D.nac.dim_prom;
    // rural/urbano por dimensión no está desagregado en JSON → usamos IEIE global de zona como referencia contextual;
    // el dumbbell compara territorio vs nacional (y muestra puntos rural/urbano del IEIE global como líneas guía).
    // Dumbbell por dimensión: territorio vs nacional
    var rows=DIMS.slice().reverse();
    var terrData=[], nacData=[], lines=[];
    rows.forEach(function(d,i){
      var tv=c?num(terr[d]):null, nv=num(nacD[d]);
      if(c&&tv!==null)terrData.push([tv,i]);
      if(nv!==null)nacData.push([nv,i]);
      if(c&&tv!==null&&nv!==null)lines.push([[Math.min(tv,nv),i],[Math.max(tv,nv),i]]);
    });
    var legend=$("#dumbbell-legend");
    legend.innerHTML=(c?'<span class="lg"><span class="dot" style="background:'+MAGENTA+'"></span>'+c.nombre+'</span>':'')+
      '<span class="lg"><span class="dot" style="background:'+PURPLE+'"></span>Nacional</span>';
    var series=[];
    if(lines.length)series.push({type:"custom",renderItem:function(p,api){
        var s=api.coord(lines[p.dataIndex][0]),e=api.coord(lines[p.dataIndex][1]);
        return {type:"line",shape:{x1:s[0],y1:s[1],x2:e[0],y2:e[1]},style:{stroke:"#cbb8dd",lineWidth:2}};
      },data:lines,z:1,silent:true});
    series.push({name:"Nacional",type:"scatter",data:nacData,symbolSize:11,itemStyle:{color:PURPLE},z:2});
    if(c)series.push({name:c.nombre,type:"scatter",data:terrData,symbolSize:13,itemStyle:{color:MAGENTA},z:3});
    ech("chart-dumbbell").setOption({
      grid:{left:8,right:26,top:10,bottom:24,containLabel:true},
      tooltip:{trigger:"axis",axisPointer:{type:"cross"},formatter:function(ps){
        var i=ps[0].data[1]; var d=rows[i]; var tv=c?num(terr[d]):null,nv=num(nacD[d]);
        return dimName(d)+"<br/>"+(c?(c.nombre+": "+(tv===null?ETA:tv.toFixed(1))+"<br/>"):"")+"Nacional: "+(nv===null?ETA:nv.toFixed(1));
      }},
      xAxis:{type:"value",min:0,max:100,axisLabel:{fontSize:11}},
      yAxis:{type:"category",data:rows.map(function(d){return d;}),axisLabel:{fontSize:12,fontWeight:600,color:"#3a1354",formatter:function(v){return v;}}},
      series:series
    },true);

    // Brechas
    var gaps=DIMS.map(function(d){ var tv=c?num(terr[d]):num(nacD[d]); var nv=num(nacD[d]); return (c&&tv!==null&&nv!==null)?+(tv-nv).toFixed(1):(c?null:0); });
    ech("chart-brechas").setOption({
      grid:{left:8,right:20,top:10,bottom:24,containLabel:true},
      tooltip:{trigger:"axis",valueFormatter:function(v){return (v>0?"+":"")+v;}},
      xAxis:{type:"value",axisLabel:{fontSize:11,formatter:function(v){return (v>0?"+":"")+v;}}},
      yAxis:{type:"category",data:DIMS,axisLabel:{fontSize:11}},
      series:[{type:"bar",data:gaps.map(function(g){return g===null?0:g;}),barMaxWidth:15,
        itemStyle:{color:function(p){var v=p.value;return v>=0?TEAL:"#d0594e";},borderRadius:2},
        label:{show:!!c,position:"right",fontSize:9.5,formatter:function(p){return p.value>0?"+"+p.value:p.value;},color:"#574c63"}}]
    },true);
    if(!c)ech("chart-brechas").setOption({series:[{label:{show:false}}]});

    // KPIs análisis
    var box=$("#an-kpis");
    if(c){
      box.innerHTML=
        '<div class="an-kpi"><div class="l">IEIE territorio</div><div class="v">'+fmt(c.ieie,2)+'</div></div>'+
        '<div class="an-kpi"><div class="l">IEIE nacional</div><div class="v">'+fmt(D.nac.ieie_nacional,2)+'</div></div>'+
        '<div class="an-kpi"><div class="l">Comp. más crítico</div><div class="v crit">'+dimName(c.dim_critica)+'</div></div>'+
        '<div class="an-kpi"><div class="l">Comp. más fuerte</div><div class="v strong">'+dimName(c.dim_fuerte)+'</div></div>';
    } else {
      var arr=DIMS.map(function(d){return [d,num(nacD[d])];}).filter(function(x){return x[1]!==null;});
      var mn=arr.slice().sort(function(a,b){return a[1]-b[1];})[0], mx=arr.slice().sort(function(a,b){return b[1]-a[1];})[0];
      box.innerHTML=
        '<div class="an-kpi"><div class="l">IEIE nacional</div><div class="v">'+fmt(D.nac.ieie_nacional,2)+'</div></div>'+
        '<div class="an-kpi"><div class="l">Sedes válidas</div><div class="v">'+fmtInt(D.nac.muestra_valida)+'</div></div>'+
        '<div class="an-kpi"><div class="l">Comp. más crítico</div><div class="v crit">'+dimName(mn[0])+'</div></div>'+
        '<div class="an-kpi"><div class="l">Comp. más fuerte</div><div class="v strong">'+dimName(mx[0])+'</div></div>';
    }
    if(radarChart && !$("#chart-radar").hidden) pintarRadar();
  }

  function toggleRadar(){
    var el=$("#chart-radar"), btn=$("#btn-toggle-radar");
    var show=el.hidden; el.hidden=!show; btn.setAttribute("aria-expanded",show?"true":"false");
    btn.textContent=show?"Ocultar radar":"Mostrar radar";
    if(show){ if(!radarChart)radarChart=echarts.init(el); pintarRadar(); setTimeout(function(){radarChart.resize();},30); }
  }
  function pintarRadar(){
    var c=ctx(), terr=c?c.dim_prom:null, nacD=D.nac.dim_prom;
    var ind=DIMS.map(function(d){return {name:d,max:100};});
    var data=[{value:DIMS.map(function(d){return num(nacD[d])||0;}),name:"Nacional",lineStyle:{color:PURPLE},itemStyle:{color:PURPLE},areaStyle:{color:"rgba(58,19,84,.10)"}}];
    if(c)data.unshift({value:DIMS.map(function(d){return num(terr[d])||0;}),name:c.nombre,lineStyle:{color:MAGENTA},itemStyle:{color:MAGENTA},areaStyle:{color:"rgba(214,72,110,.15)"}});
    radarChart.setOption({tooltip:{},legend:{bottom:0,textStyle:{fontSize:11}},
      radar:{indicator:ind,radius:"64%",axisName:{fontSize:11,color:"#574c63"}},
      series:[{type:"radar",data:data}]},true);
  }

  /* ---------- Glosario (pestaña propia, LOOP R1) ---------- */
  function construirGlosario(){
    var g=D.glos, cont=$("#glosario");
    var promNac=D.nac.dim_prom||{};
    cont.innerHTML=g.dimensiones.map(function(d,i){
      var pv=num(promNac[d.cod]);
      var rel = pv===null ? "Aporta al IEIE como uno de los nueve componentes." :
        ("Promedio nacional de este componente: <b>"+fmt(pv,2)+"</b> / 100. Es uno de los nueve componentes que promedian el IEIE.");
      return '<div class="gl-item" data-i="'+i+'">'+
        '<button class="gl-head" aria-expanded="false"><span class="gl-code">'+d.cod+'</span>'+d.nombre+'<span class="gl-arrow" aria-hidden="true">▾</span></button>'+
        '<div class="gl-body">'+
          '<p><span class="lbl">Qué mide:</span> '+d.def+'</p>'+
          '<p><span class="lbl">Variables que lo integran / cómo se calcula:</span> '+d.calculo+'</p>'+
          '<p><span class="lbl">Orientación del puntaje:</span> escala 0–100; un valor más alto indica mejores condiciones relativas declaradas.</p>'+
          '<p><span class="lbl">Interpretación:</span> léase junto con la cobertura y la suficiencia muestral del territorio; valores de autorreporte, no verificados en campo.</p>'+
          '<p><span class="lbl">Limitaciones:</span> proviene de autorreporte institucional; el código 999 marca casos no calculables que se excluyen del promedio.</p>'+
          '<p><span class="lbl">Relación con el IEIE:</span> '+rel+'</p>'+
        '</div></div>';
    }).join("");
    $$(".gl-head",cont).forEach(function(btn){
      btn.addEventListener("click",function(){
        var item=btn.parentNode, open=item.classList.toggle("open");
        btn.setAttribute("aria-expanded",open?"true":"false");
      });
    });
    $("#glosario-fuente").textContent="Fuente: "+g.fuente;
  }

  /* ---------- Metodología ---------- */
  function construirMetodologia(){
    var g=D.glos, n=D.nac;
    var cats=$("#tabla-categorias");
    cats.innerHTML='<div class="trow head"><div>Categoría</div><div>Rango</div><div>Interpretación</div></div>'+
      g.categorias.map(function(c){
        var col=CAT_COLOR[c.nombre.split(" ")[0]]||"#ccc";
        return '<div class="trow"><div><span class="swatch" style="background:'+col+'"></span>'+c.nombre+'</div><div>'+c.rango+'</div><div>'+c.interp+'</div></div>';
      }).join("");
    var cal=$("#tabla-calidad");
    cal.innerHTML='<div class="trow head"><div>Nivel</div><div>Condición</div></div>'+
      g.calidad.map(function(c){return '<div class="trow"><div>'+c.nivel+'</div><div>'+c.cond+'</div></div>';}).join("");
    function li(a){return a.map(function(t){return "<li>"+t+"</li>";}).join("");}
    // 1 objetivo · 21 alcance descriptivo · 22 no causalidad · 18 corte
    $("#met-objetivo").innerHTML=li([
      "<b>Objetivo del tablero:</b> presentar de forma descriptiva el estado de la infraestructura educativa oficial de Colombia medido por el IEIE 2026, para consulta nacional y territorial.",
      "<b>Alcance descriptivo:</b> el tablero describe niveles y distribuciones; <b>no demuestra relaciones causales</b> entre variables ni evalúa políticas o gestiones.",
      "<b>Fecha de corte:</b> base consolidada de la encuesta FFIE 2026 (corte del levantamiento 2026)."]);
    // 2 fuentes · 4 unidad · 5 duplicados · 6 válidos
    $("#met-fuentes").innerHTML=li([
      "<b>Fuentes:</b> marco poblacional oficial de sedes (hoja Total) y base consolidada de resultados de la encuesta FFIE 2026 con el IEIE ya calculado.",
      "<b>Unidad de análisis:</b> la <b>sede educativa</b> oficial, identificada por su código DANE (12 dígitos, tratado como texto).",
      "<b>Duplicados:</b> se verificó que no existen códigos DANE duplicados ni en el marco (48.565 únicos) ni en la base de resultados (19.070 únicos).",
      "<b>Registros válidos:</b> "+fmtInt(n.muestra_valida)+" sedes tras excluir "+n.atipicos_excluidos+" registros atípicos críticos (calidad \u201cPendiente validación\u201d)."]);
    // 3 marco vs muestra
    $("#met-marco").innerHTML=li([
      "<b>Marco poblacional:</b> universo de sedes oficiales del país ("+fmtInt(n.marco_total_sedes)+" sedes); es el denominador de la cobertura.",
      "<b>Muestra obtenida:</b> sedes con encuesta válida ("+fmtInt(n.muestra_valida)+"). La diferencia entre marco y muestra NO es un error: es la parte del universo aún sin encuesta.",
      "<b>Cobertura:</b> muestra / marco = "+pct(n.cobertura_pct)+" a nivel nacional; se reporta también por departamento y municipio.",
      "<b>Cobertura territorial:</b> "+n.cobertura_territorial+". Bogotá D.C. es Distrito Capital, no un departamento adicional."]);
    // 7 construcción previa · 8 escala · 9 dimensiones · 10 interpretación
    $("#met-indice").innerHTML=li([
      "<b>Construcción previa:</b> el IEIE llega ya calculado en la base oficial (promedio ponderado de nueve componentes con renormalización de pesos cuando hay componentes no calculables). <b>Este tablero no lo recalcula.</b>",
      "<b>Escala:</b> 0 a 100; valores más altos indican mejores condiciones relativas de infraestructura.",
      "<b>Componentes:</b> nueve (D1–D9): servicios públicos, antigüedad y estado, accesibilidad y entorno, ambientes y capacidad, ambientes inhabilitados, condiciones físicas, confort, dotación y mobiliario, y afectación académica (ver la pestaña Glosario).",
      "<b>Interpretación:</b> el índice es relativo y autorreportado; debe leerse junto con la cobertura y la suficiencia muestral del territorio."]);
    // 11 agregaciones · 12 niveles · 13 rural-urbano
    $("#met-agreg").innerHTML=li([
      "<b>Agregaciones territoriales:</b> promedios simples del IEIE de las sedes válidas de cada ámbito (país, departamento, municipio) y por zona.",
      "<b>Nacional vs departamental vs municipal:</b> cambian el número de sedes y el denominador del marco; los promedios municipales con pocas sedes son más volátiles y se marcan por suficiencia.",
      "<b>Comparación rural-urbana:</b> usa el tipo de predio reportado por la sede (Rural/Urbano); se presenta a nivel nacional y por territorio."]);
    // 14 suficiencia · 15 faltantes · 17 precauciones
    $("#met-suf").innerHTML=li([
      "<b>Suficiencia muestral:</b> umbral de "+D.suf.umbral+" sedes válidas por territorio. Con menos, el resultado se marca \u201cestimación con precaución / no evaluable\u201d: "+D.suf.territorios_advertencia.join(" y ")+".",
      "<b>Valores faltantes:</b> el código <code>999</code> = dimensión \u201cNo calculable\u201d; nunca se grafica ni entra en promedios (D5: 279, D6: 18, D8: 1 casos).",
      "<b>Precaución en baja muestra:</b> los territorios insuficientes aparecen en gris neutro en mapas y con advertencia en fichas; su IEIE no permite inferencias concluyentes."]);
    // 20 anonimización
    $("#met-priv").innerHTML=li([
      "<b>Política de anonimización:</b> los archivos públicos solo contienen agregados territoriales; no se publican registros individuales de sedes ni microdatos.",
      "No se incluyen nombres, correos, teléfonos, fechas de visita, coordenadas ni ningún dato del diligenciador de la encuesta.",
      "Las bases originales (XLSX) no forman parte de la carpeta pública del tablero."]);
    // 16 autorreporte · limitaciones
    $("#met-lim").innerHTML=li([
      "<b>Autorreporte:</b> la encuesta es diligenciada por la propia sede; puede haber errores de percepción, interpretación o registro no verificados en campo.",
      "La cobertura es parcial ("+pct(n.cobertura_pct)+" del marco); los resultados representan a las sedes encuestadas, no necesariamente a todo el universo.",
      "La \u201cprioridad territorial\u201d del mapa es <b>exploratoria</b> (regla transparente en config_mapas.json), no una clasificación oficial.",
      "Un municipio (código 27493) tiene datos pero carece de geometría en el MGN cargado; se muestra en tablas pero no en el mapa municipal."]);
    // 19 fuente de cada gráfico
    $("#tabla-fuentes").innerHTML='<div class="trow head"><div>Componente</div><div>Fuente de datos</div></div>'+
      [["KPIs y tarjetas","resumen_nacional.json · resumen_departamental.json · resumen_municipal.json"],
       ["Ranking territorial","resumen_departamental.json (IEIE promedio por territorio)"],
       ["Distribución por categoría","dist_categoria (conteos oficiales de categoria_ieie)"],
       ["Comparación rural-urbana","resultados_rural_urbano.json / campos ieie_urbano · ieie_rural"],
       ["Dumbbell y brechas por dimensión","dim_prom (promedios D1–D9 sin 999)"],
       ["Glosario de componentes","glosario_dimensiones.json (Informe Metodológico oficial)"],
       ["Ficha territorial y variables","variables_detalle.json (distribuciones con n válidas y faltantes)"],
       ["Mapas (todas las capas)","geo/*.geojson (MGN 2018) + JSON de agregados; reglas en config_mapas.json"]]
      .map(function(r){return '<div class="trow"><div>'+r[0]+'</div><div>'+r[1]+'</div></div>';}).join("");
    $("#metod-fuente").textContent="Fuente metodológica: "+g.fuente;
  }

  /* ---------- FICHA TERRITORIAL Y TEMÁTICA ---------- */
  function construirFichaSelectores(){
    // (filtro "Tipo de sede" retirado del interfaz público en LOOP R1; la variable sigue en el modelo)
    // dimensión
    var dsel=$("#dim-select");
    [["D1","Servicios (D1)"],["D2","Estado (D2)"],["D3","Acceso (D3)"],["D7","Confort (D7)"],
     ["D8","Mobiliario (D8)"],["D9","Académica (D9)"],["—","Cobertura/contexto"]].forEach(function(p){
      var o=document.createElement("option"); o.value=p[0]; o.textContent=p[1]; dsel.appendChild(o); });
    dsel.addEventListener("change",function(){ state.dim=this.value; state.vari=""; poblarVariables(); pintarVariable(); });
    $("#var-select").addEventListener("change",function(){ state.vari=this.value; state.cat=""; pintarVariable(); });
    poblarVariables();
  }
  function poblarVariables(){
    var vs=$("#var-select"); vs.innerHTML="";
    var lista=D.vtem?[]:[];
    var vars=D.vdet.meta.variables.filter(function(v){ return !state.dim || v.dimension===state.dim; });
    vars.forEach(function(v){ var o=document.createElement("option"); o.value=v.clave; o.textContent=v.etiqueta; vs.appendChild(o); });
    if(vars.length){ state.vari=vars[0].clave; vs.value=state.vari; } else state.vari="";
  }

  function fichaScope(){ // devuelve {nombre, sub, obj, nivel, cod2}
    var c=ctx(), m=ctxMpio();
    if(m)return {nombre:m.nombre, sub:"Municipio en "+(c?c.nombre:""), obj:m, nivel:"municipio", cod2:c?c.cod:null};
    if(c)return {nombre:c.nombre, sub:c.es_distrito_capital?"Distrito Capital":"Departamento", obj:c, nivel:"departamento", cod2:c.cod};
    return {nombre:"Colombia — total nacional", sub:"Nivel país", obj:D.nac, nivel:"nacional", cod2:null};
  }

  function pintarFicha(){
    var s=fichaScope(), o=s.obj, c=ctx();
    $("#ficha-nombre").textContent=s.nombre; $("#ficha-sub").textContent=s.sub;
    var suf = (s.nivel==="nacional")?"suficiente":(o.suficiencia||"suficiente");
    var chip=$("#ficha-chip");
    chip.className="chip-suf "+(suf==="insuficiente"?"warn":"ok");
    chip.textContent=suf==="insuficiente"?"⚠ Muestra insuficiente":"✔ Suficiencia adecuada";

    var marco = s.nivel==="nacional"?D.nac.marco_total_sedes:o.marco_sedes;
    var muestra = s.nivel==="nacional"?D.nac.muestra_valida:o.muestra_valida;
    var cob = s.nivel==="nacional"?D.nac.cobertura_pct:o.cobertura_pct;
    var ieie = s.nivel==="nacional"?D.nac.ieie_nacional:o.ieie;
    var crit = s.nivel==="nacional"?dimCriticaNac():(o.dim_critica||"—");
    $("#ficha-kpis").innerHTML=[
      ["Total de sedes (marco)",fmtInt(marco),"marco poblacional"],
      ["Muestra obtenida",fmtInt(muestra),"encuestas válidas"],
      ["Cobertura",pct(cob),"muestra / marco"],
      ["IEIE",fmt(ieie,2),catOf(ieie)||""],
      ["Dimensión crítica",crit,dimLbl[crit]||""],
      ["Suficiencia",suf==="insuficiente"?"Insuficiente":"Adecuada",suf==="insuficiente"?"< "+D.suf.umbral+" sedes":"≥ "+D.suf.umbral+" sedes"]
    ].map(function(k){return '<div class="kpi"><span class="k-lbl">'+k[0]+'</span><span class="k-val sm">'+k[1]+'</span><span class="k-sub">'+k[2]+'</span></div>';}).join("");

    // comparación nacional
    ech("ficha-comp").setOption({
      grid:{left:8,right:20,top:10,bottom:20,containLabel:true},
      tooltip:{trigger:"axis",valueFormatter:function(v){return (+v).toFixed(2);}},
      xAxis:{type:"value",min:0,max:100},
      yAxis:{type:"category",data:["Nacional",s.nivel==="nacional"?"Nacional":s.nombre].filter(function(x,i,a){return a.indexOf(x)===i;})},
      series:[{type:"bar",data:(s.nivel==="nacional"?[{value:+D.nac.ieie_nacional.toFixed(2),itemStyle:{color:PURPLE}}]:
        [{value:+D.nac.ieie_nacional.toFixed(2),itemStyle:{color:"#b79dc9"}},{value:+num(o.ieie).toFixed(2),itemStyle:{color:MAGENTA}}]),
        barMaxWidth:26,label:{show:true,position:"right",fontSize:11,formatter:function(p){return p.value.toFixed(1);}}}]
    },true);

    // rural-urbana ficha
    var uu = s.nivel==="nacional"?D.nac.ieie_urbano:num(o.ieie_urbano);
    var rr = s.nivel==="nacional"?D.nac.ieie_rural:num(o.ieie_rural);
    ech("ficha-ru").setOption({
      grid:{left:8,right:16,top:10,bottom:20,containLabel:true},
      tooltip:{trigger:"axis",valueFormatter:function(v){return v==null?ETA:(+v).toFixed(2);}},
      xAxis:{type:"category",data:["Urbana","Rural"]},
      yAxis:{type:"value",min:0,max:100},
      series:[{type:"bar",data:[uu,rr],barMaxWidth:44,itemStyle:{color:function(p){return p.dataIndex===0?BLUE:AMBER;},borderRadius:[4,4,0,0]},
        label:{show:true,position:"top",fontSize:11,formatter:function(p){return p.value==null?ETA:p.value.toFixed(1);}}}]
    },true);

    pintarNarrativa(s); pintarAlertas(s); pintarVariable();
  }

  function dimCriticaNac(){
    var arr=DIMS.map(function(d){return [d,num(D.nac.dim_prom[d])];}).filter(function(x){return x[1]!==null;}).sort(function(a,b){return a[1]-b[1];});
    return arr[0][0];
  }

  function pintarNarrativa(s){
    var o=s.obj, nac=D.nac;
    if(s.nivel==="nacional"){
      $("#ficha-narrativa").innerHTML="A nivel <b>nacional</b>, el IEIE promedio es <b>"+fmt(nac.ieie_nacional,2)+"</b> ("+catOf(nac.ieie_nacional)+"). "+
        "La encuesta cubrió <b>"+pct(nac.cobertura_pct)+"</b> del marco ("+fmtInt(nac.muestra_valida)+"/"+fmtInt(nac.marco_total_sedes)+" sedes). "+
        "La diferencia rural–urbana es de <b>"+fmt(nac.ieie_urbano-nac.ieie_rural,1)+"</b> puntos (urbano "+fmt(nac.ieie_urbano,1)+", rural "+fmt(nac.ieie_rural,1)+"). "+
        "La dimensión con menor puntaje es <b>"+dimName(dimCriticaNac())+"</b>.";
      return;
    }
    var ieie=num(o.ieie), brecha=ieie-nac.ieie_nacional;
    var rel = Math.abs(brecha)<1?"cerca del":(brecha>0?"por encima del":"por debajo del");
    var ur = (num(o.ieie_urbano)!==null&&num(o.ieie_rural)!==null)?("La diferencia rural–urbana es de <b>"+fmt(o.ieie_urbano-o.ieie_rural,1)+"</b> puntos. "):"";
    var prec = (o.suficiencia==="insuficiente")?"Por su <b>muestra insuficiente</b> (menos de "+D.suf.umbral+" sedes), estos valores deben leerse como estimación con precaución, no como inferencia concluyente.":"La muestra es suficiente para una lectura territorial.";
    $("#ficha-narrativa").innerHTML="En <b>"+s.nombre+"</b>"+(s.sub?(" ("+s.sub+")"):"")+", el IEIE promedio es <b>"+fmt(ieie,2)+"</b> ("+catOf(ieie)+"), "+
      rel+" promedio nacional ("+fmt(nac.ieie_nacional,2)+") por <b>"+fmt(Math.abs(brecha),1)+"</b> puntos. "+
      "La cobertura de la encuesta fue <b>"+pct(o.cobertura_pct)+"</b> ("+fmtInt(o.muestra_valida)+"/"+fmtInt(o.marco_sedes)+" sedes). "+ur+
      "La componente más crítico es <b>"+dimName(o.dim_critica)+"</b> y la más fuerte <b>"+dimName(o.dim_fuerte)+"</b>. "+prec;
  }

  function pintarAlertas(s){
    var o=s.obj, alerts=[], forts=[];
    if(s.nivel!=="nacional" && o.modulos){
      var M=o.modulos;
      var reglas=[
        [M.servicios&&M.servicios.agua_no_continua,"Agua no continua","servicios"],
        [M.servicios&&M.servicios.sin_internet,"Sin internet","servicios"],
        [M.servicios&&M.servicios.sin_acueducto,"Sin acueducto","servicios"],
        [M.acceso&&M.acceso.sin_camaras,"Sin cámaras/seguridad","acceso"],
        [M.acceso&&M.acceso.riesgo,"Cercanía a zona de riesgo","acceso"],
        [M.confort&&M.confort.sin_ventilacion,"Sin ventilación adecuada","confort"],
        [M.mobiliario&&M.mobiliario.insuficiente,"Mobiliario insuficiente","mobiliario"],
        [M.academica&&M.academica.suspension,"Suspensión de clases","academica"]
      ];
      reglas.forEach(function(r){ var v=num(r[0]); if(v===null)return;
        if(v>=50)alerts.push([r[1],v]); else if(v<=15)forts.push([r[1],v]); });
      alerts.sort(function(a,b){return b[1]-a[1];}); forts.sort(function(a,b){return a[1]-b[1];});
    }
    $("#ficha-alertas").innerHTML = alerts.length?alerts.slice(0,6).map(function(a){return '<span class="chip alert">'+a[0]+" · "+pct(a[1])+"</span>";}).join(""):'<span class="chip neutral">Sin alertas críticas por umbral (≥50 %).</span>';
    $("#ficha-fortalezas").innerHTML = forts.length?forts.slice(0,6).map(function(a){return '<span class="chip good">'+a[0]+" · "+pct(a[1])+"</span>";}).join(""):'<span class="chip neutral">Selecciona un departamento para ver potencialidades.</span>';
    if(s.nivel==="nacional"){ $("#ficha-alertas").innerHTML='<span class="chip neutral">Selecciona un departamento o municipio para ver alertas territoriales.</span>'; }
  }

  function pintarVariable(){
    if(!state.vari){ return; }
    var s=fichaScope();
    var scopeData = (s.cod2 && D.vdet.departamental[s.cod2]) ? D.vdet.departamental[s.cod2] : D.vdet.nacional;
    var nivelTxt = (s.cod2 && D.vdet.departamental[s.cod2]) ? s.nombre : "Nacional";
    var vd = scopeData[state.vari];
    var meta = D.vdet.meta.variables.filter(function(v){return v.clave===state.vari;})[0]||{};
    if(!vd){ $("#var-chart").innerHTML=""; return; }
    // meta line
    $("#var-meta").innerHTML=
      '<span><b>'+(meta.etiqueta||state.vari)+'</b></span>'+
      '<span>Nivel: '+nivelTxt+'</span>'+
      '<span>Obs. válidas: <b>'+fmtInt(vd.n_validas)+'</b></span>'+
      '<span class="'+(vd.pct_faltantes>=10?"warn":"")+'">Faltantes: '+pct(vd.pct_faltantes)+' ('+fmtInt(vd.n_faltantes)+')</span>'+
      '<span>Dimensión: '+(meta.dimension||"—")+'</span>';
    // barras horizontales de categorías (ordenadas)
    var cats=Object.keys(vd.categorias).map(function(k){return [k,vd.categorias[k]];}).sort(function(a,b){return b[1]-a[1];});
    var total=cats.reduce(function(x,y){return x+y[1];},0)||1;
    ech("var-chart").setOption({
      grid:{left:8,right:40,top:10,bottom:20,containLabel:true},
      tooltip:{trigger:"item",formatter:function(p){var n=cats[p.dataIndex][1];return cats[p.dataIndex][0]+"<br/>"+fmtInt(n)+" sedes ("+(100*n/total).toFixed(1)+"%)";}},
      xAxis:{type:"value",axisLabel:{fontSize:11}},
      yAxis:{type:"category",data:cats.map(function(c){return c[0];}).reverse(),axisLabel:{fontSize:11,width:180,overflow:"truncate"}},
      series:[{type:"bar",data:cats.map(function(c){return c[1];}).reverse(),barMaxWidth:22,
        itemStyle:{color:MAGENTA,borderRadius:[0,4,4,0]},
        label:{show:true,position:"right",fontSize:10,formatter:function(p){return (100*p.value/total).toFixed(1)+"%";},color:"#574c63"}}]
    },true);
    var cf=$("#var-cat-filter");
    cf.innerHTML='<span class="vc">'+cats.length+' categoría(s)</span>'+cats.map(function(c){return '<span class="vc">'+c[0]+": "+fmtInt(c[1])+"</span>";}).join("");
    $("#var-foot").innerHTML="Observaciones válidas: <b>"+fmtInt(vd.n_validas)+"</b> · Datos faltantes: <b>"+pct(vd.pct_faltantes)+"</b> · Nivel geográfico: <b>"+nivelTxt+"</b> · Fuente: "+D.vdet.meta.fuente+
      (s.obj&&s.obj.suficiencia==="insuficiente"?' · <span class="warn" style="color:#8a5312;font-weight:700">Precaución: muestra insuficiente.</span>':"");
  }

  /* ---------- MAPA (Leaflet) con inset San Andrés ---------- */
  function rampaIEIE(v){ if(v===null)return "#dcd3e4"; if(v>=80)return "#2f9e8f"; if(v>=70)return "#7cc0a8"; if(v>=60)return "#cfe3b0"; if(v>=40)return "#e0a253"; return "#d0594e"; }
  function styleFeat(feat){
    var d=D.depByCod[feat.properties.cod]; var v=d?num(d.ieie):null;
    var st={fillColor:rampaIEIE(v),weight:1,color:"#fff",fillOpacity:.85};
    if(d&&d.suficiencia==="insuficiente"){ st.fillPattern=null; st.dashArray="3 3"; st.weight=1.4; st.color="#8a5312"; }
    return st;
  }
  function popupHtml(d,nombre){
    if(!d)return '<div class="popup-t">'+nombre+'</div><div class="popup-r">Sin información.</div>';
    var h='<div class="popup-t">'+d.nombre+(d.es_distrito_capital?" (Distrito Capital)":"")+'</div>'+
      '<div class="popup-r">IEIE: <b>'+fmt(d.ieie,2)+'</b> · '+(d.categoria_modal||"")+'</div>'+
      '<div class="popup-r">Cobertura: '+pct(d.cobertura_pct)+' ('+fmtInt(d.muestra_valida)+'/'+fmtInt(d.marco_sedes)+')</div>';
    if(d.suficiencia==="insuficiente")h+='<span class="popup-warn">⚠ Muestra insuficiente — estimación con precaución</span>';
    return h;
  }
  function onEach(feat,layer){
    var d=D.depByCod[feat.properties.cod]; var nombre=d?d.nombre:feat.properties.nombre;
    layer.bindTooltip(nombre+(d?": "+fmt(d.ieie,1):""),{sticky:true});
    layer.bindPopup(popupHtml(d,nombre));
    layer.on("click",function(){ if(d){ state.dep=d.cod; state.mpio=""; $("#dep-select").value=d.cod; poblarMunicipios(); render(); } });
    layer.on("mouseover",function(){ layer.setStyle({weight:2.5,color:MAGENTA}); layer.bringToFront(); });
    layer.on("mouseout",function(){ geoLayer.resetStyle(layer); resaltarMapa(); });
  }
  function initMapa(){
    map=L.map("map",{scrollWheelZoom:true,attributionControl:true}).setView([4.6,-73.2],5);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{attribution:'&copy; OpenStreetMap, &copy; CARTO',subdomains:"abcd",maxZoom:18}).addTo(map);
    // continente: excluir San Andrés del layer principal (se muestra en inset)
    var cont={type:"FeatureCollection",features:geo.features.filter(function(f){return f.properties.cod!=="88";})};
    geoLayer=L.geoJSON(cont,{style:styleFeat,onEachFeature:onEach}).addTo(map);
    pintarLeyenda();
    construirInset();
    resaltarMapa();
  }
  function construirInset(){
    var sa=geo.features.filter(function(f){return f.properties.cod==="88";});
    if(!sa.length)return;
    // control Leaflet como inset en esquina superior izquierda
    var InsetCtl=L.Control.extend({options:{position:"topleft"},
      onAdd:function(){
        var div=L.DomUtil.create("div","inset-wrap");
        div.style.cssText="width:120px;height:120px;border:2px solid #fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.25);overflow:hidden;background:#eaf4f2;margin-top:8px";
        div.innerHTML='<div id="inset-map" style="width:100%;height:92px"></div><div style="font-size:9.5px;text-align:center;padding:2px;background:#fff;color:#3a1354;font-weight:700">San Andrés, Prov. y Sta. Catalina</div>';
        L.DomEvent.disableClickPropagation(div);
        return div;
      }});
    map.addControl(new InsetCtl());
    setTimeout(function(){
      insetMap=L.map("inset-map",{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false}).setView([12.9,-81.55],7);
      insetLayer=L.geoJSON({type:"FeatureCollection",features:sa},{style:styleFeat,onEachFeature:function(feat,layer){
        var d=D.depByCod["88"];
        layer.bindTooltip((d?d.nombre+": "+fmt(d.ieie,1):"San Andrés"),{sticky:true});
        layer.bindPopup(popupHtml(d,"San Andrés"));
        layer.on("click",function(){ state.dep="88"; state.mpio=""; $("#dep-select").value="88"; poblarMunicipios(); render(); });
      }}).addTo(insetMap);
    },100);
  }
  function resaltarMapa(){
    if(geoLayer)geoLayer.eachLayer(function(layer){
      var d=D.depByCod[layer.feature.properties.cod];
      if(state.dep && d && d.cod===state.dep){ layer.setStyle({weight:3,color:MAGENTA}); layer.bringToFront(); }
      else geoLayer.resetStyle(layer);
    });
  }
  function pintarLeyenda(){
    $("#map-legend").innerHTML=
      '<span class="lk"><i style="background:#2f9e8f"></i>≥80 Adecuado</span>'+
      '<span class="lk"><i style="background:#7cc0a8"></i>70–79</span>'+
      '<span class="lk"><i style="background:#cfe3b0"></i>60–69</span>'+
      '<span class="lk"><i style="background:#e0a253"></i>40–59 Deficiente</span>'+
      '<span class="lk"><i style="background:#d0594e"></i>&lt;40 Crítico</span>'+
      '<span class="lk lk-hatch"><i></i>Muestra insuficiente</span>'+
      '<span class="lk"><i style="background:#dcd3e4"></i>Sin dato</span>';
  }

  /* ---------- MAPAS INTERACTIVOS (LOOP 5) ---------- */
  var CAT_DIM_COLOR={D1:"#4e79b8",D2:"#7b6aa0",D3:"#2f9e8f",D4:"#8fb05a",D5:"#59a5b0",D6:"#d0594e",D7:"#e0a253",D8:"#c77fa6",D9:"#6f9e6a"};
  function construirMapasInteractivos(){
    var capaSel=$("#capa-select");
    D.cfg.capas_mapa.forEach(function(c){ var o=document.createElement("option"); o.value=c.id; o.textContent=c.titulo; capaSel.appendChild(o); });
    capaSel.value="ieie";
    var vsel=$("#capa-var-select");
    var og1=document.createElement("optgroup"); og1.label="Categóricas (encuesta)";
    D.vdet.meta.variables.forEach(function(v){ var o=document.createElement("option"); o.value=v.clave; o.textContent=v.etiqueta; og1.appendChild(o); });
    vsel.appendChild(og1);
    var og2=document.createElement("optgroup"); og2.label="Numéricas (encuesta)";
    D.vnum.meta.variables.forEach(function(v){ var o=document.createElement("option"); o.value="num:"+v.clave; o.textContent=v.etiqueta; og2.appendChild(o); });
    vsel.appendChild(og2);
    // datalist búsqueda
    $("#map-buscar-list").innerHTML=D.deps.map(function(d){return '<option value="'+d.nombre+'">';}).join("");

    capaSel.addEventListener("change",function(){ m2State.capa=this.value; $("#mt-tematica").hidden=(this.value!=="tematica"); pintarMapa2(); });
    vsel.addEventListener("change",function(){ m2State.vari=this.value; pintarMapa2(); });
    $("#nivel-select").addEventListener("change",function(){ cambiarNivel(this.value); });
    $("#map-buscar").addEventListener("change",function(){ buscarTerr(this.value); });
    $("#map2-reset").addEventListener("click",function(){ m2State.capa="ieie"; m2State.nivel="departamental"; capaSel.value="ieie"; $("#nivel-select").value="departamental"; $("#mt-tematica").hidden=true; $("#map-buscar").value=""; state.dep=""; state.mpio=""; if(map2){map2.setView([4.6,-73.2],5);} renderMap2Side(null); pintarMapa2(); });

    map2=L.map("map2",{scrollWheelZoom:true}).setView([4.6,-73.2],5);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{attribution:'&copy; OpenStreetMap, &copy; CARTO',subdomains:"abcd",maxZoom:18}).addTo(map2);
    construirInset2();
    pintarMapa2(); renderMap2Side(null);
  }

  function cambiarNivel(nivel){
    if(nivel==="municipal" && !mgeo){
      $("#map2-src").textContent="Cargando geometría municipal…";
      fetch("geo/municipios.geojson").then(function(r){return r.json();}).then(function(j){ mgeo=j; m2State.nivel="municipal"; pintarMapa2(); })
        .catch(function(){ $("#map2-src").textContent="No se pudo cargar la geometría municipal."; $("#nivel-select").value="departamental"; });
    } else { m2State.nivel=nivel; pintarMapa2(); }
  }

  // escalas de color por capa (accesibles; insuficiente/sin dato SIEMPRE en gris neutro, nunca rojo)
  function colorFor(capa,d){
    if(!d) return "#dcd3e4"; // sin info
    if((capa==="ieie"||capa==="prioridad"||capa==="tematica"||capa==="cobertura"||capa==="perfil_ru"||capa==="dim_critica") && d.suficiencia==="insuficiente" && capa!=="suficiencia")
      { if(capa==="prioridad"||capa==="suficiencia") {} else return "#9aa0a6"; } // insuficiente = gris (no rojo)
    if(capa==="ieie"){ var v=num(d.ieie); return v===null?"#dcd3e4":(v>=80?"#1b7a6b":v>=70?"#5cb59f":v>=60?"#b6dcc4":v>=40?"#e0a253":"#c0392b"); }
    if(capa==="cobertura"){ var c=num(d.cobertura_pct); return c===null?"#dcd3e4":(c>=60?"#08519c":c>=45?"#3182bd":c>=30?"#6baed6":c>=15?"#bdd7e7":"#eff3ff"); }
    if(capa==="suficiencia"){ return d.suficiencia==="insuficiente"?"#9aa0a6":"#2f9e8f"; }
    if(capa==="dim_critica"){ return CAT_DIM_COLOR[d.dim_critica]||"#ccc"; }
    if(capa==="perfil_ru"){ var u=num(d.ieie_urbano),r=num(d.ieie_rural); if(u===null||r===null)return "#dcd3e4"; var br=u-r; return br>=15?"#8c510a":br>=8?"#d8b365":br>=3?"#f6e8c3":br>=-3?"#c7eae5":"#5ab4ac"; }
    if(capa==="prioridad"){ var p=d.prioridad_exploratoria; var m={alta:"#b5341f",media:"#e0a253",baja:"#2f9e8f",no_evaluable:"#9aa0a6",sin_info:"#dcd3e4"}; return m[p]||"#dcd3e4"; }
    if(capa==="tematica"){
      if(esVarNum()){
        var qv=numQuintiles(), pv=numDeptoStat(d.cod);
        if(qv===null||pv===null)return "#dcd3e4";
        return pv>=qv[3]?"#7a0177":pv>=qv[2]?"#c51b8a":pv>=qv[1]?"#f768a1":pv>=qv[0]?"#fbb4b9":"#feebe2";
      }
      var val=temValue(d); return val===null?"#dcd3e4":(val>=75?"#7a0177":val>=50?"#c51b8a":val>=25?"#f768a1":val>=10?"#fbb4b9":"#feebe2");
    }
    return "#dcd3e4";
  }
  function temValue(d){ // % de la variable temática seleccionada (usa módulos precomputados si existe)
    if(!d||!d.modulos)return null;
    var map={agua_continua:["servicios","agua_no_continua"],internet:["servicios","sin_internet"],acueducto:["servicios","sin_acueducto"],
      energia:["servicios","sin_energia"],intervenida:["estado","intervenidas"],estado_sede:["estado","cierre"],
      camaras:["acceso","sin_camaras"],ventilacion:["confort","sin_ventilacion"],ruido:["confort","ruido"],
      mobiliario:["mobiliario","insuficiente"],suspension:["academica","suspension"]};
    var p=map[m2State.vari]; if(!p||!d.modulos[p[0]])return null; var v=d.modulos[p[0]][p[1]]; return v===undefined?null:num(v);
  }
  function esVarNum(){ return m2State.vari && m2State.vari.indexOf("num:")===0; }
  function varNumKey(){ return esVarNum()?m2State.vari.slice(4):null; }
  function numDeptoStat(cod){ // promedio departamental de la variable numérica activa
    var k=varNumKey(); if(!k)return null;
    var dd=D.vnum.departamental[cod]; if(!dd||!dd[k]||!dd[k].n)return null;
    return dd[k].prom;
  }
  function numQuintiles(){ // cortes de quintil sobre los 33 promedios departamentales
    var k=varNumKey(); if(!k)return null;
    var a=[]; Object.keys(D.vnum.departamental).forEach(function(c){ var s=D.vnum.departamental[c][k]; if(s&&s.n)a.push(s.prom); });
    if(a.length<5)return null;
    a.sort(function(x,y){return x-y;});
    function q(p){ var i=(a.length-1)*p, lo=Math.floor(i); return a[lo]+(a[Math.min(lo+1,a.length-1)]-a[lo])*(i-lo); }
    return [q(.2),q(.4),q(.6),q(.8)];
  }

  function styleM2(feat){
    var nivel=m2State.nivel, cod=nivel==="municipal"?feat.properties.cod5:feat.properties.cod;
    var d=nivel==="municipal"?D.muniByCod[cod]:D.depByCod[cod];
    var st={fillColor:colorFor(m2State.capa,d),weight:nivel==="municipal"?.4:.9,color:"#fff",fillOpacity:.85};
    if(d&&d.suficiencia==="insuficiente"){ st.dashArray="2 2"; st.color="#7a7a7a"; st.weight=1; }
    return st;
  }
  function m2Popup(d,nombre,nivel){
    if(!d)return '<div class="popup-t">'+nombre+'</div><div class="popup-r">Sin información en la muestra.</div>';
    var capaLbl={ieie:"IEIE",cobertura:"Cobertura",suficiencia:"Suficiencia",dim_critica:"Comp. crítico",perfil_ru:"Brecha U-R",prioridad:"Prioridad (expl.)",tematica:"Variable"};
    var h='<div class="popup-t">'+nombre+'</div>'+
      '<div class="popup-r">IEIE: <b>'+fmt(d.ieie,2)+'</b>'+(d.categoria_modal?" · "+d.categoria_modal:"")+'</div>'+
      '<div class="popup-r">Cobertura: '+pct(d.cobertura_pct)+' · n='+fmtInt(d.muestra_valida)+' de '+fmtInt(d.marco_sedes)+'</div>';
    if(m2State.capa==="tematica"){ var tv=temValue(d); h+='<div class="popup-r">'+($("#capa-var-select option:checked")?$("#capa-var-select").selectedOptions[0].textContent:"Variable")+': <b>'+(tv===null?"—":pct(tv))+'</b></div>'; }
    if(m2State.capa==="prioridad"){ var pm={alta:"Necesidad alta",media:"Necesidad media",baja:"Necesidad baja",no_evaluable:"No evaluable (muestra insuficiente)",sin_info:"Sin información"}; h+='<div class="popup-r">Prioridad exploratoria: <b>'+(pm[d.prioridad_exploratoria]||"—")+'</b></div>'; }
    if(d.suficiencia==="insuficiente")h+='<span class="popup-warn">⚠ Muestra insuficiente — no evaluable de forma concluyente</span>';
    return h;
  }
  function onEachM2(feat,layer){
    var nivel=m2State.nivel, cod=nivel==="municipal"?feat.properties.cod5:feat.properties.cod;
    var d=nivel==="municipal"?D.muniByCod[cod]:D.depByCod[cod];
    var nombre=nivel==="municipal"?(feat.properties.nombre+" ("+cod+")"):(d?d.nombre:feat.properties.nombre);
    layer.bindTooltip(nombre+(d?": IEIE "+fmt(d.ieie,1)+" · n="+fmtInt(d.muestra_valida):" · sin dato"),{sticky:true});
    layer.bindPopup(m2Popup(d,nombre,nivel));
    layer.on("click",function(){ if(nivel==="departamental"&&d){ state.dep=d.cod; renderMap2Side(d); } else if(d){ renderMap2Side(d,true); } });
    layer.on("mouseover",function(){ layer.setStyle({weight:2.5,color:"#3a1354"}); layer.bringToFront(); renderMap2Side(d, nivel==="municipal"); });
    layer.on("mouseout",function(){ m2Layer.resetStyle(layer); });
  }
  function pintarMapa2(){
    if(!map2)return;
    var isMuni=m2State.nivel==="municipal";
    if(isMuni && !mgeo){ cambiarNivel("municipal"); return; }
    var src=isMuni?mgeo:geo;
    var feats=src.features.filter(function(f){ return isMuni?true:(f.properties.cod!=="88"); }); // San Andrés en inset (solo depto)
    if(m2Layer){ map2.removeLayer(m2Layer); }
    m2Layer=L.geoJSON({type:"FeatureCollection",features:feats},{style:styleM2,onEachFeature:onEachM2}).addTo(map2);
    if(m2Inset)m2Inset.setStyle(styleM2);
    pintarLeyenda2(); actualizarFuente2();
    // refrescar el bloque descriptivo del panel con el ámbito actual
    var selD = state.dep ? D.depByCod[state.dep] : null;
    pintarDescriptivoM2(selD);
  }
  function actualizarFuente2(){
    var capa=D.cfg.capas_mapa.filter(function(c){return c.id===m2State.capa;})[0];
    var n=D.nac;
    $("#map2-src").innerHTML="Capa: <b>"+(capa?capa.titulo:m2State.capa)+"</b> · Nivel: "+(m2State.nivel==="municipal"?"municipal":"departamental")+
      " · Fuente: encuesta FFIE 2026 (n="+fmtInt(n.muestra_valida)+" sedes válidas). "+
      (m2State.capa==="prioridad"?"Prioridad exploratoria (no oficial); regla en config_mapas.json.":"")+
      " Los territorios con muestra insuficiente se muestran en gris neutro (no evaluable).";
  }
  function pintarLeyenda2(){
    var L2=$("#map2-legend"); var capa=m2State.capa; var h="";
    function row(c,t){ return '<span class="lk"><i style="background:'+c+'"></i>'+t+'</span>'; }
    if(capa==="ieie")h=row("#1b7a6b","≥80")+row("#5cb59f","70–79")+row("#b6dcc4","60–69")+row("#e0a253","40–59")+row("#c0392b","<40");
    else if(capa==="cobertura")h=row("#08519c","≥60%")+row("#3182bd","45–59%")+row("#6baed6","30–44%")+row("#bdd7e7","15–29%")+row("#eff3ff","<15%");
    else if(capa==="suficiencia")h=row("#2f9e8f","Suficiente (≥30)")+row("#9aa0a6","Insuficiente (<30)");
    else if(capa==="dim_critica")h=DIMS.map(function(d){return row(CAT_DIM_COLOR[d],d);}).join("");
    else if(capa==="perfil_ru")h=row("#8c510a","Urbano ≫ rural")+row("#d8b365","+8 a +15")+row("#f6e8c3","±")+row("#c7eae5","Rural ≥ urbano");
    else if(capa==="prioridad")h=row("#b5341f","Necesidad alta")+row("#e0a253","Media")+row("#2f9e8f","Baja")+row("#9aa0a6","No evaluable")+row("#dcd3e4","Sin info");
    else if(capa==="tematica"){
      if(esVarNum()){
        var qv=numQuintiles();
        if(qv){ h=row("#7a0177","≥ "+qv[3].toFixed(1))+row("#c51b8a",qv[2].toFixed(1)+"–"+qv[3].toFixed(1))+row("#f768a1",qv[1].toFixed(1)+"–"+qv[2].toFixed(1))+row("#fbb4b9",qv[0].toFixed(1)+"–"+qv[1].toFixed(1))+row("#feebe2","< "+qv[0].toFixed(1))+'<span class="lk" style="color:#7c7488">(promedio por depto, quintiles)</span>'; }
        else h=row("#dcd3e4","Sin datos suficientes");
      }
      else h=row("#7a0177","≥75%")+row("#c51b8a","50–74%")+row("#f768a1","25–49%")+row("#fbb4b9","10–24%")+row("#feebe2","<10%");
    }
    h+=row("#dcd3e4","Sin dato")+'<span class="lk lk-hatch"><i></i>Muestra insuficiente</span>';
    L2.innerHTML=h;
  }
  function renderMap2Side(d,isMuni){
    if(!d){ $("#m2-name").textContent="Colombia"; $("#m2-sub").textContent="Vista nacional";
      var n=D.nac;
      $("#m2-kpis").innerHTML=kpiRow("IEIE nacional",fmt(n.ieie_nacional,2))+kpiRow("Muestra",fmtInt(n.muestra_valida))+kpiRow("Cobertura",pct(n.cobertura_pct));
      $("#m2-suf").hidden=true; $("#m2-note").textContent="Haz clic en un territorio para ver su ficha resumida.";
      pintarDescriptivoM2(null); return; }
    $("#m2-name").textContent=isMuni?(d.nombre+" ("+d.departamento+")"):d.nombre;
    $("#m2-sub").textContent=isMuni?"Nivel municipal":(d.es_distrito_capital?"Distrito Capital":"Departamento");
    $("#m2-kpis").innerHTML=kpiRow("IEIE",fmt(d.ieie,2)+(catOf(d.ieie)?" · "+catOf(d.ieie):""))+
      kpiRow("Muestra / marco",fmtInt(d.muestra_valida)+" / "+fmtInt(d.marco_sedes))+
      kpiRow("Cobertura",pct(d.cobertura_pct))+
      (d.dim_critica?kpiRow("Comp. crítico",dimName(d.dim_critica)):"");
    var suf=$("#m2-suf");
    if(d.suficiencia==="insuficiente"){ suf.hidden=false; suf.className="chip-suf warn"; suf.textContent="⚠ No evaluable — requiere fortalecimiento de la muestra"; }
    else { suf.hidden=false; suf.className="chip-suf ok"; suf.textContent="✔ Suficiencia adecuada"; }
    $("#m2-note").textContent="Fuente: encuesta FFIE 2026. Cifras del ámbito seleccionado.";
    pintarDescriptivoM2(isMuni?null:d);
  }

  /* Bloque descriptivo de la variable temática en el panel del mapa.
     Categóricas: barras territorio vs nacional. Numéricas: estadísticos + histograma. */
  function pintarDescriptivoM2(d){
    var box=$("#m2-var-desc");
    if(m2State.capa!=="tematica"){ box.innerHTML=""; return; }
    var cod=d?d.cod:null;
    if(esVarNum()){
      var k=varNumKey();
      var meta=D.vnum.meta.variables.filter(function(v){return v.clave===k;})[0]||{};
      var s=(cod&&D.vnum.departamental[cod]&&D.vnum.departamental[cod][k]&&D.vnum.departamental[cod][k].n)?D.vnum.departamental[cod][k]:D.vnum.nacional[k];
      var nivel=(cod&&D.vnum.departamental[cod]&&D.vnum.departamental[cod][k]&&D.vnum.departamental[cod][k].n)?(d?d.nombre:"Nacional"):"Nacional";
      if(!s||!s.n){ box.innerHTML='<p class="m2d-empty">Sin datos de la variable en este ámbito.</p>'; return; }
      var nacS=D.vnum.nacional[k];
      var permiteSuma=(function(){ var mv=(D.metaVars&&D.metaVars.variables)||[]; var r=mv.filter(function(x){return x.variable===k;})[0]; return r?r.permite_suma:true; })();
      var h='<p class="m2d-title">'+(meta.etiqueta||k)+'</p>'+
        '<p class="m2d-sub">Nivel: '+nivel+' · unidad: '+(meta.unidad||"")+' · variable cuantitativa</p>'+
        '<div class="m2d-stats">'+
          (permiteSuma&&s.suma!==undefined?('<span>Suma <b>'+fmtInt(s.suma)+'</b></span>'):'')+
          '<span>Prom. <b>'+fmt(s.prom,1)+'</b></span><span>Mediana <b>'+fmt(s.mediana,1)+'</b></span>'+
          '<span>Q1–Q3 <b>'+fmt(s.q1,1)+'–'+fmt(s.q3,1)+'</b></span>'+
          '<span>Mín–Máx <b>'+fmt(s.min,0)+'–'+fmt(s.max,0)+'</b></span>'+
        '</div>';
      // mini histograma en divs
      var mx=Math.max.apply(null,s.hist.bins)||1;
      h+='<div class="m2d-hist">'+s.hist.bins.map(function(b){
        return '<i style="height:'+Math.max(3,Math.round(42*b/mx))+'px" title="'+b+' sedes"></i>';
      }).join("")+'</div>';
      h+='<p class="m2d-axis">0 — '+fmt(s.hist.lim_sup,0)+' '+(meta.unidad||"")+(s.hist.sobre_lim?(' · +'+s.hist.sobre_lim+' por encima'):'')+'</p>';
      if(nivel!=="Nacional"&&nacS&&nacS.n)h+='<p class="m2d-ref">Referente nacional: prom. '+fmt(nacS.prom,1)+' · mediana '+fmt(nacS.mediana,1)+'</p>';
      h+='<p class="m2d-meta">n válidas: '+fmtInt(s.n)+' · faltantes: '+pct(s.pct_faltantes)+'</p>';
      box.innerHTML=h;
    } else {
      var vk=m2State.vari;
      var meta2=D.vdet.meta.variables.filter(function(v){return v.clave===vk;})[0]||{};
      var scope=(cod&&D.vdet.departamental[cod])?D.vdet.departamental[cod]:D.vdet.nacional;
      var nivel2=(cod&&D.vdet.departamental[cod])?(d?d.nombre:"Nacional"):"Nacional";
      var vd=scope[vk], vn=D.vdet.nacional[vk];
      if(!vd||!vd.n_validas){ box.innerHTML='<p class="m2d-empty">Sin datos de la variable en este ámbito.</p>'; return; }
      var tot=vd.n_validas||1, totN=(vn&&vn.n_validas)||1;
      var cats=Object.keys(vd.categorias).map(function(c){return [c,vd.categorias[c]];}).sort(function(a,b){return b[1]-a[1];}).slice(0,5);
      var h2='<p class="m2d-title">'+(meta2.etiqueta||vk)+'</p>'+
        '<p class="m2d-sub">Nivel: '+nivel2+' · distribución vs. nacional</p>';
      cats.forEach(function(cpair){
        var p1=100*cpair[1]/tot;
        var p2=vn&&vn.categorias[cpair[0]]!==undefined?100*vn.categorias[cpair[0]]/totN:null;
        h2+='<div class="m2d-cat"><span class="l">'+cpair[0]+'</span>'+
          '<span class="b1"><i style="width:'+Math.round(p1)+'%"></i></span><span class="v1">'+p1.toFixed(1)+'%</span>'+
          (p2!==null&&nivel2!=="Nacional"?('<span class="b2"><i style="width:'+Math.round(p2)+'%"></i></span><span class="v2">nac. '+p2.toFixed(1)+'%</span>'):'')+
        '</div>';
      });
      h2+='<p class="m2d-meta">n válidas: '+fmtInt(vd.n_validas)+' · faltantes: '+pct(vd.pct_faltantes)+'</p>';
      box.innerHTML=h2;
    }
  }
  function kpiRow(l,v){ return '<div class="kpi"><span class="k-lbl">'+l+'</span><span class="k-val">'+v+'</span></div>'; }
  function buscarTerr(nombre){
    var d=D.deps.filter(function(x){return x.nombre.toLowerCase()===nombre.toLowerCase();})[0];
    if(!d)return;
    if(d.cod==="88"&&m2InsetMap){ renderMap2Side(d); return; }
    if(m2Layer)m2Layer.eachLayer(function(layer){ if(layer.feature.properties.cod===d.cod){ map2.fitBounds(layer.getBounds()); layer.openPopup(); renderMap2Side(d); } });
  }
  function construirInset2(){
    var sa=geo.features.filter(function(f){return f.properties.cod==="88";});
    if(!sa.length)return;
    var Ctl=L.Control.extend({options:{position:"topleft"},onAdd:function(){
      var div=L.DomUtil.create("div","inset-wrap");
      div.style.cssText="width:118px;height:120px;border:2px solid #fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.25);overflow:hidden;background:#eaf4f2;margin-top:8px";
      div.innerHTML='<div id="m2-inset-map" style="width:100%;height:92px"></div><div style="font-size:9px;text-align:center;padding:2px;background:#fff;color:#3a1354;font-weight:700">San Andrés y Prov.</div>';
      L.DomEvent.disableClickPropagation(div); return div;
    }});
    map2.addControl(new Ctl());
    setTimeout(function(){
      m2InsetMap=L.map("m2-inset-map",{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false}).setView([12.9,-81.55],7);
      m2Inset=L.geoJSON({type:"FeatureCollection",features:sa},{style:styleM2,onEachFeature:function(feat,layer){
        var d=D.depByCod["88"]; layer.bindTooltip("San Andrés: IEIE "+fmt(d.ieie,1),{sticky:true});
        layer.bindPopup(m2Popup(d,"San Andrés, Prov. y Sta. Catalina","departamental"));
        layer.on("click",function(){ renderMap2Side(d); });
      }}).addTo(m2InsetMap);
    },120);
  }

  /* ---------- EXPLORADOR DE SEDES (LOOP R1) ---------- */
  var expState={dep:"",mun:"",zona:"",q:"",sort:"ieie",dir:-1,page:0,per:40,rows:[],all:[],cache:{}};
  function construirExplorador(){
    var dsel=$("#exp-dep");
    D.deps.slice().sort(function(a,b){return a.nombre.localeCompare(b.nombre,"es");})
      .forEach(function(d){ var o=document.createElement("option"); o.value=d.cod; o.textContent=d.nombre+" ("+d.muestra_valida+")"; dsel.appendChild(o); });
    dsel.addEventListener("change",function(){ expState.dep=this.value; expState.mun=""; expState.q=""; $("#exp-buscar").value=""; cargarSedesDep(this.value); });
    $("#exp-mun").addEventListener("change",function(){ expState.mun=this.value; expState.page=0; filtrarExplorador(); });
    $("#exp-zona").addEventListener("change",function(){ expState.zona=this.value; expState.page=0; filtrarExplorador(); });
    var bq=$("#exp-buscar"); var t=null;
    bq.addEventListener("input",function(){ clearTimeout(t); var v=this.value; t=setTimeout(function(){ expState.q=v.trim().toLowerCase(); expState.page=0; filtrarExplorador(); },200); });
    $$("#exp-table thead th").forEach(function(th){ th.addEventListener("click",function(){
      var k=th.getAttribute("data-sort"); if(!k)return;
      if(expState.sort===k)expState.dir*=-1; else {expState.sort=k; expState.dir=(k==="ieie"?-1:1);}
      expState.page=0; renderExplTabla();
    }); });
  }
  function cargarSedesDep(cod){
    if(!cod){ expState.all=[]; $("#exp-mun").disabled=true; $("#exp-buscar").disabled=true; $("#exp-count").textContent="Selecciona un departamento para cargar sus sedes."; $("#exp-tbody").innerHTML=""; $("#exp-pager").innerHTML=""; return; }
    $("#exp-count").textContent="Cargando sedes…";
    function done(arr){
      expState.all=arr; expState.cache[cod]=arr;
      var msel=$("#exp-mun"); msel.innerHTML='<option value="">Todos</option>';
      var muns={}; arr.forEach(function(s){ muns[s.mun]=(muns[s.mun]||0)+1; });
      Object.keys(muns).sort(function(a,b){return a.localeCompare(b,"es");}).forEach(function(m){ var o=document.createElement("option"); o.value=m; o.textContent=m+" ("+muns[m]+")"; msel.appendChild(o); });
      msel.disabled=false; $("#exp-buscar").disabled=false;
      expState.mun=""; expState.zona=""; expState.q=""; expState.page=0; $("#exp-zona").value=""; filtrarExplorador();
    }
    if(expState.cache[cod])done(expState.cache[cod]);
    else fetch("data/sedes/"+cod+".json").then(function(r){return r.json();}).then(done)
      .catch(function(){ $("#exp-count").textContent="No se pudo cargar el departamento."; });
  }
  function filtrarExplorador(){
    var a=expState.all||[]; var q=expState.q, mun=expState.mun, zona=expState.zona;
    expState.rows=a.filter(function(s){
      if(mun&&s.mun!==mun)return false;
      if(zona&&s.zona!==zona)return false;
      if(q){ var hay=(s.dane||"").toLowerCase().indexOf(q)>=0 || (s.sede||"").toLowerCase().indexOf(q)>=0 || (s.ie||"").toLowerCase().indexOf(q)>=0 || (s.mun||"").toLowerCase().indexOf(q)>=0; if(!hay)return false; }
      return true;
    });
    renderExplTabla();
  }
  function renderExplTabla(){
    var k=expState.sort, dir=expState.dir;
    expState.rows.sort(function(x,y){
      var a=x[k],b=y[k];
      if(k==="ieie"){ a=a===null?-1:a; b=b===null?-1:b; return (a-b)*dir; }
      return String(a||"").localeCompare(String(b||""),"es")*dir;
    });
    var n=expState.rows.length, per=expState.per, pages=Math.max(1,Math.ceil(n/per));
    if(expState.page>=pages)expState.page=0;
    var slice=expState.rows.slice(expState.page*per,(expState.page+1)*per);
    $("#exp-count").innerHTML="<b>"+fmtInt(n)+"</b> sede(s) · fuente: encuesta FFIE 2026";
    $("#exp-tbody").innerHTML=slice.map(function(s,i){
      var cat=s.cat||"—"; var col=CAT_COLOR[cat.split(" ")[0]]||"#ccc";
      return '<tr data-i="'+(expState.page*per+i)+'"><td class="mono">'+(s.dane||"—")+'</td><td>'+(s.sede||"—")+'</td><td>'+(s.mun||"—")+'</td><td>'+(s.zona||"—")+'</td>'+
        '<td class="num"><b>'+fmt(s.ieie,1)+'</b></td><td><span class="cat-dot" style="background:'+col+'"></span>'+cat+'</td></tr>';
    }).join("");
    $$("#exp-tbody tr").forEach(function(tr){ tr.addEventListener("click",function(){ fichaSede(expState.rows[+tr.getAttribute("data-i")]); $$("#exp-tbody tr").forEach(function(x){x.classList.remove("sel");}); tr.classList.add("sel"); }); });
    var pg=$("#exp-pager");
    if(pages<=1){ pg.innerHTML=""; }
    else {
      pg.innerHTML='<button class="btn-ghost sm" id="pg-prev" '+(expState.page===0?"disabled":"")+'>‹ Anterior</button>'+
        '<span class="pg-info">Página '+(expState.page+1)+' de '+pages+'</span>'+
        '<button class="btn-ghost sm" id="pg-next" '+(expState.page>=pages-1?"disabled":"")+'>Siguiente ›</button>';
      var pv=$("#pg-prev"),nx=$("#pg-next");
      if(pv)pv.addEventListener("click",function(){ if(expState.page>0){expState.page--;renderExplTabla();} });
      if(nx)nx.addEventListener("click",function(){ if(expState.page<pages-1){expState.page++;renderExplTabla();} });
    }
  }
  function fichaSede(s){
    if(!s)return;
    $("#exp-ficha-nombre").textContent=s.sede||"Sede";
    $("#exp-ficha-sub").textContent=(s.ie?s.ie+" · ":"")+s.mun+", "+s.dep+" · zona "+(s.zona||"—");
    var dimNames={D1:"Servicios básicos",D2:"Antigüedad y estado",D3:"Accesibilidad y entorno",D4:"Ambientes y capacidad",D5:"Ambientes inhabilitados",D6:"Condiciones físicas",D7:"Confort",D8:"Dotación y mobiliario",D9:"Afectación académica"};
    var cat=s.cat||"—"; var col=CAT_COLOR[cat.split(" ")[0]]||"#ccc";
    var h='<div class="exp-kpirow"><div class="kpi"><span class="k-lbl">IEIE</span><span class="k-val" style="color:'+col+'">'+fmt(s.ieie,1)+'</span><span class="k-sub">'+cat+'</span></div>'+
      '<div class="kpi"><span class="k-lbl">Calidad del dato</span><span class="k-val sm">'+(s.cal||"—")+'</span><span class="k-sub">DANE '+(s.dane||"—")+'</span></div></div>';
    h+='<p class="exp-comp-t">Componentes (D1–D9)</p><div class="exp-comps">';
    (s.d||[]).forEach(function(v,i){
      var cod="D"+(i+1); var val=v;
      var w=val===null?0:Math.max(2,Math.round(val));
      var c=val===null?"#dcd3e4":(val>=80?"#2f9e8f":val>=60?"#7cc0a8":val>=40?"#e0a253":"#d0594e");
      h+='<div class="exp-comp"><span class="ec-l" title="'+dimNames[cod]+'">'+cod+'</span><span class="ec-bar"><i style="width:'+w+'%;background:'+c+'"></i></span><span class="ec-v">'+(val===null?"n/c":fmt(val,0))+'</span></div>';
    });
    h+='</div>';
    h+='<p class="exp-warn">El IEIE es un índice de autorreporte (escala 0–100); no reemplaza una inspección técnica de ingeniería o arquitectura. Localización a nivel municipal (sin coordenadas exactas). Fuente: encuesta FFIE 2026.</p>';
    $("#exp-ficha-body").innerHTML=h;
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot); else boot();
})();
