/* Executive Portfolio Analytics
 * All observations are synthetic and deterministically generated.
 * No remote data source, tracking, or corporate data is used.
 */
(function () {
  "use strict";

  const PRODUCTS = ["Auto", "Residencial", "Vida", "Empresarial"];
  const REGIONS = ["Sudeste", "Sul", "Nordeste", "Centro-Oeste", "Norte"];
  const CHANNELS = ["Corretores", "Parceiros", "Digital"];
  const COLORS = {
    Auto: "#22d3ee", Residencial: "#60a5fa", Vida: "#a78bfa", Empresarial: "#34d399",
    Sudeste: "#22d3ee", Sul: "#60a5fa", Nordeste: "#a78bfa", "Centro-Oeste": "#34d399", Norte: "#fbbf24",
    Corretores: "#22d3ee", Parceiros: "#60a5fa", Digital: "#a78bfa"
  };
  const CHART_IDS = ["trend-chart", "product-chart", "performance-chart", "region-chart", "channel-chart"];
  const BASE_PREMIUM = {Auto: 430000, Residencial: 200000, Vida: 310000, Empresarial: 520000};
  const REGION_WEIGHT = {Sudeste: 1, Sul: 0.65, Nordeste: 0.58, "Centro-Oeste": 0.33, Norte: 0.21};
  const CHANNEL_WEIGHT = {Corretores: 1, Parceiros: 0.72, Digital: 0.46};
  const BASE_LOSS = {Auto: 0.63, Residencial: 0.44, Vida: 0.51, Empresarial: 0.72};
  const BASE_EXPENSE = {Auto: 0.16, Residencial: 0.16, Vida: 0.18, Empresarial: 0.15};
  const BASE_COMMISSION = {Auto: 0.09, Residencial: 0.10, Vida: 0.13, Empresarial: 0.105};
  const MONTHS = [];
  for (let year = 2024; year <= 2026; year += 1) {
    for (let month = 1; month <= (year === 2026 ? 9 : 12); month += 1) {
      MONTHS.push(String(year) + "-" + String(month).padStart(2, "0"));
    }
  }

  function seededRandom(seed) {
    let state = seed >>> 0;
    return function () {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }
  const random = seededRandom(20260910);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const round = value => Math.round(value * 100) / 100;

  function createRows() {
    const rows = [];
    MONTHS.forEach((monthKey, monthIndex) => {
      const month = Number(monthKey.slice(5));
      const season = 1 + 0.075 * Math.sin((month - 1) * Math.PI / 6) + (month === 12 ? 0.045 : 0);
      const growth = Math.pow(1.085, monthIndex / 12);
      PRODUCTS.forEach(product => {
        REGIONS.forEach(region => {
          CHANNELS.forEach(channel => {
            const variation = 0.92 + random() * 0.16;
            const digitalLift = channel === "Digital" ? 1 + monthIndex * 0.012 : 1;
            const written = round(BASE_PREMIUM[product] * REGION_WEIGHT[region] * CHANNEL_WEIGHT[channel] * season * growth * variation * digitalLift);
            const earned = round(written * (0.965 + random() * 0.07));
            const lossRegional = region === "Sul" ? 0.022 : region === "Nordeste" ? 0.014 : 0;
            const lossChannel = channel === "Digital" ? -0.024 : channel === "Parceiros" ? 0.012 : 0;
            const lossRatio = clamp(BASE_LOSS[product] + lossRegional + lossChannel + (random() - 0.5) * 0.11 + (month === 2 ? 0.015 : 0), 0.22, 0.93);
            const expenseRatio = BASE_EXPENSE[product] + (channel === "Digital" ? 0.013 : 0) + (random() - 0.5) * 0.018;
            const commissionRatio = BASE_COMMISSION[product] + (channel === "Parceiros" ? 0.011 : channel === "Digital" ? -0.03 : 0) + (random() - 0.5) * 0.014;
            const claims = round(earned * lossRatio);
            const expenses = round(earned * expenseRatio);
            const commissions = round(earned * commissionRatio);
            rows.push({
              month: monthKey, product, region, channel, written, earned, claims, expenses, commissions,
              result: round(earned - claims - expenses - commissions)
            });
          });
        });
      });
    });
    return rows;
  }

  const DATA = createRows();
  const state = {period: "last12", product: "all", region: "all", channel: "all"};
  const chartInstances = {};
  const brNumber = new Intl.NumberFormat("pt-BR", {minimumFractionDigits: 1, maximumFractionDigits: 1});
  const currencyFull = new Intl.NumberFormat("pt-BR", {style: "currency", currency: "BRL", maximumFractionDigits: 0});

  function money(value) {
    if (!Number.isFinite(value)) return "—";
    const sign = value < 0 ? "−" : "";
    const abs = Math.abs(value);
    if (abs >= 1000000000) return sign + "R$ " + brNumber.format(abs / 1000000000) + " bi";
    if (abs >= 1000000) return sign + "R$ " + brNumber.format(abs / 1000000) + " mi";
    if (abs >= 1000) return sign + "R$ " + brNumber.format(abs / 1000) + " mil";
    return sign + currencyFull.format(abs);
  }
  function pct(value, precision) {
    return value == null || !Number.isFinite(value) ? "—" : new Intl.NumberFormat("pt-BR", {style:"percent", minimumFractionDigits:precision == null ? 1 : precision, maximumFractionDigits:precision == null ? 1 : precision}).format(value);
  }
  function aggregate(rows) {
    const sums = {written:0,earned:0,claims:0,expenses:0,commissions:0,result:0,count:rows.length};
    rows.forEach(row => {
      sums.written += row.written;
      sums.earned += row.earned;
      sums.claims += row.claims;
      sums.expenses += row.expenses;
      sums.commissions += row.commissions;
      sums.result += row.result;
    });
    sums.lossRatio = sums.earned ? sums.claims / sums.earned : null;
    sums.combined = sums.earned ? (sums.claims + sums.expenses + sums.commissions) / sums.earned : null;
    return sums;
  }
  function groupBy(rows, field) {
    const map = new Map();
    rows.forEach(row => {
      const key = row[field];
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    });
    return Array.from(map, ([key, items]) => ({key, ...aggregate(items)}));
  }
  function monthsForPeriod(period) {
    if (period === "last12") return MONTHS.slice(-12);
    if (period === "all") return MONTHS.slice();
    return MONTHS.filter(key => key.startsWith(period + "-"));
  }
  function priorMonth(key) {
    return String(Number(key.slice(0,4)) - 1) + key.slice(4);
  }
  function filteredRows(monthKeys) {
    const monthsSet = new Set(monthKeys);
    return DATA.filter(row => monthsSet.has(row.month) &&
      (state.product === "all" || row.product === state.product) &&
      (state.region === "all" || row.region === state.region) &&
      (state.channel === "all" || row.channel === state.channel));
  }
  function allByMonth(rows, months) {
    const lookup = new Map();
    rows.forEach(row => {
      if (!lookup.has(row.month)) lookup.set(row.month, []);
      lookup.get(row.month).push(row);
    });
    return months.map(key => ({key, ...aggregate(lookup.get(key) || [])}));
  }
  function labelMonth(key) {
    const names = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    return names[Number(key.slice(5)) - 1] + "/" + key.slice(2,4);
  }
  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }
  function setTone(id, tone) {
    const node = document.getElementById(id);
    if (!node) return;
    node.classList.toggle("positive", tone === "positive");
    node.classList.toggle("negative", tone === "negative");
  }
  function optionColors() {
    return {
      textStyle:{fontFamily:"Inter, sans-serif",color:"#b9c9de",fontSize:11},
      animationDuration:550,
      tooltip:{backgroundColor:"#0c192d",borderColor:"#416078",borderWidth:1,textStyle:{color:"#e9f5ff",fontSize:12},extraCssText:"border-radius:10px;box-shadow:0 14px 30px rgba(0,0,0,.35);"},
      grid:{left:10,right:12,top:35,bottom:24,containLabel:true}
    };
  }
  function axisLine() {
    return {axisLine:{show:false},axisTick:{show:false},axisLabel:{color:"#8fa5bd",fontSize:10},splitLine:{lineStyle:{color:"rgba(150,174,207,.10)",type:"solid"}}};
  }
  function chartInstance(id) {
    if (!window.echarts) return null;
    if (!chartInstances[id]) {
      chartInstances[id] = window.echarts.init(document.getElementById(id),null,{renderer:"canvas"});
    }
    return chartInstances[id];
  }
  function filterThrough(field, value) {
    state[field] = state[field] === value ? "all" : value;
    document.getElementById(field + "-filter").value = state[field];
    render();
  }
  function showFallback(message) {
    CHART_IDS.forEach(id => {
      const node = document.getElementById(id);
      node.innerHTML = '<div class="chart-error">Os gráficos não puderam ser carregados.<br>Verifique a conexão e recarregue a página.<br>' + message + '</div>';
    });
  }

  function renderTrend(rows, months) {
    const chart = chartInstance("trend-chart");
    if (!chart) return;
    const series = allByMonth(rows, months);
    const xLabels = series.map(x => labelMonth(x.key));
    const maxRatio = Math.max(1.1, ...series.map(x => x.combined || 0));
    chart.setOption({
      ...optionColors(),
      color:["#22d3ee","#477cfc","#fbbf24"],
      legend:{top:0,right:0,itemWidth:10,itemHeight:8,textStyle:{color:"#9dafc7",fontSize:10},data:["Prêmios ganhos","Sinistros","Índice combinado"]},
      grid:{left:5,right:14,top:54,bottom:25,containLabel:true},
      xAxis:{type:"category",data:xLabels,...axisLine(),axisLabel:{color:"#8198b0",fontSize:10,interval:"auto"},splitLine:{show:false}},
      yAxis:[
        {type:"value",name:"R$ mi",nameTextStyle:{color:"#7893ac",fontSize:10},...axisLine(),axisLabel:{color:"#8198b0",fontSize:10,formatter:value => brNumber.format(value / 1000000)}},
        {type:"value",min:0,max:Math.ceil(maxRatio * 10) / 10,axisLabel:{color:"#8b9fba",fontSize:10,formatter:value => Math.round(value * 100) + "%"},axisTick:{show:false},splitLine:{show:false},axisLine:{show:false}}
      ],
      tooltip:{...optionColors().tooltip,trigger:"axis",axisPointer:{type:"shadow"},formatter:params => {
        const index = params[0].dataIndex;
        const data = series[index];
        return "<b>" + xLabels[index] + "</b><br>Prêmios ganhos: " + money(data.earned) + "<br>Sinistros: " + money(data.claims) + "<br>Índice combinado: " + pct(data.combined);
      }},
      series:[
        {name:"Prêmios ganhos",type:"bar",data:series.map(x=>round(x.earned)),barMaxWidth:15,itemStyle:{borderRadius:[4,4,0,0]}},
        {name:"Sinistros",type:"bar",data:series.map(x=>round(x.claims)),barMaxWidth:15,itemStyle:{borderRadius:[4,4,0,0]}},
        {name:"Índice combinado",type:"line",yAxisIndex:1,data:series.map(x=>x.combined == null ? null : round(x.combined)),symbol:"circle",symbolSize:5,smooth:.25,lineStyle:{width:2},itemStyle:{color:"#fbbf24"}}
      ]
    },true);
  }

  function renderMix(rows) {
    const chart = chartInstance("product-chart");
    if (!chart) return;
    const items = groupBy(rows,"product").sort((a,b)=>b.written-a.written);
    const total = aggregate(rows);
    chart.setOption({
      ...optionColors(),
      color:items.map(item=>COLORS[item.key]),
      legend:{orient:"horizontal",bottom:2,left:"center",itemWidth:9,itemHeight:9,itemGap:13,textStyle:{color:"#afc1d6",fontSize:11}},
      tooltip:{...optionColors().tooltip,trigger:"item",formatter:params => params.name + "<br><b>" + money(params.value) + "</b> (" + pct(params.percent / 100) + ")"},
      graphic:[{type:"group",left:"center",top:"36%",children:[
        {type:"text",left:"center",top:0,style:{text:"PRÊMIOS",font:"600 10px Inter",fill:"#7d98b2",textAlign:"center"}},
        {type:"text",left:"center",top:20,style:{text:money(total.written),font:"700 20px Outfit",fill:"#edfaff",textAlign:"center"}}
      ]}],
      series:[{
        name:"Produto",type:"pie",radius:["54%","75%"],center:["50%","43%"],avoidLabelOverlap:true,
        label:{show:false},labelLine:{show:false},emphasis:{scaleSize:5},minAngle:3,
        itemStyle:{borderColor:"#152238",borderWidth:4,borderRadius:9},
        data:items.map(item=>({name:item.key,value:round(item.written),itemStyle:{color:COLORS[item.key]}}))
      }]
    },true);
    chart.off("click");
    chart.on("click",params=>{if (PRODUCTS.includes(params.name)) filterThrough("product",params.name);});
  }

  function renderPerformance(rows) {
    const chart = chartInstance("performance-chart");
    if (!chart) return;
    const items = groupBy(rows,"product").sort((a,b)=>(b.combined||0)-(a.combined||0));
    chart.setOption({
      ...optionColors(),
      grid:{left:8,right:43,top:18,bottom:20,containLabel:true},
      tooltip:{...optionColors().tooltip,trigger:"axis",axisPointer:{type:"shadow"},formatter:params=>{
        const key=params[0].axisValue;const found=items.find(item=>item.key===key);
        return key+"<br>Índice combinado: <b>"+pct(found.combined)+"</b><br>Resultado técnico: "+money(found.result);
      }},
      xAxis:{type:"value",min:0,max:Math.max(1.1,Math.ceil(Math.max(0,...items.map(item=>item.combined))*10)/10),...axisLine(),axisLabel:{color:"#8099b2",fontSize:10,formatter:v=>Math.round(v*100)+"%"}},
      yAxis:{type:"category",inverse:true,data:items.map(item=>item.key),axisLine:{show:false},axisTick:{show:false},axisLabel:{color:"#b5c5d7",fontSize:11},splitLine:{show:false}},
      series:[{type:"bar",barWidth:19,data:items.map(item=>({value:round(item.combined||0),itemStyle:{color:item.combined>1?"#fb7185":COLORS[item.key],borderRadius:[0,5,5,0]}})),
        label:{show:true,position:"right",formatter:params=>pct(params.value),color:"#dbe9f7",fontSize:11,fontWeight:600},
        markLine:{silent:true,symbol:"none",lineStyle:{color:"#fb7185",type:"dashed",opacity:.55},label:{formatter:"100%",color:"#fb9fae",fontSize:10},data:[{xAxis:1}]}
      }]
    },true);
    chart.off("click");
    chart.on("click",params=>{if(PRODUCTS.includes(params.name))filterThrough("product",params.name);});
  }

  function renderRegions(rows) {
    const chart = chartInstance("region-chart");
    if(!chart) return;
    const items=groupBy(rows,"region").sort((a,b)=>b.written-a.written);
    chart.setOption({
      ...optionColors(),
      color:["#22d3ee"],
      grid:{left:8,right:78,top:16,bottom:20,containLabel:true},
      tooltip:{...optionColors().tooltip,trigger:"axis",axisPointer:{type:"shadow"},formatter:params=>params[0].name+"<br>Prêmios emitidos: <b>"+money(params[0].value)+"</b>"},
      xAxis:{type:"value",...axisLine(),axisLabel:{color:"#8197ae",fontSize:10,formatter:v=>brNumber.format(v/1000000)+" mi"}},
      yAxis:{type:"category",inverse:true,data:items.map(item=>item.key),axisLine:{show:false},axisTick:{show:false},axisLabel:{color:"#b5c5d7",fontSize:11},splitLine:{show:false}},
      series:[{type:"bar",barWidth:17,data:items.map(item=>({value:round(item.written),itemStyle:{color:COLORS[item.key],borderRadius:[0,5,5,0]}})),label:{show:true,position:"right",formatter:params=>money(params.value),color:"#becfdf",fontSize:10}}]
    },true);
    chart.off("click");
    chart.on("click",params=>{if(REGIONS.includes(params.name))filterThrough("region",params.name);});
  }

  function renderChannels(rows) {
    const chart=chartInstance("channel-chart");
    if(!chart)return;
    const items=groupBy(rows,"channel").sort((a,b)=>b.written-a.written);
    const total=aggregate(rows).written;
    chart.setOption({
      ...optionColors(),
      grid:{left:13,right:88,top:10,bottom:20,containLabel:true},
      tooltip:{...optionColors().tooltip,trigger:"axis",axisPointer:{type:"shadow"},formatter:params=>params[0].name+"<br>Produção: <b>"+money(params[0].value)+"</b><br>Participação: "+pct(total?params[0].value/total:null)},
      xAxis:{type:"value",...axisLine(),axisLabel:{color:"#8098b1",fontSize:10,formatter:value=>brNumber.format(value/1000000)+" mi"}},
      yAxis:{type:"category",inverse:true,data:items.map(item=>item.key),axisLine:{show:false},axisTick:{show:false},axisLabel:{color:"#b5c5d7",fontSize:11},splitLine:{show:false}},
      series:[{type:"bar",barWidth:18,data:items.map(item=>({value:round(item.written),itemStyle:{color:COLORS[item.key],borderRadius:[0,6,6,0]}})),label:{show:true,position:"right",formatter:params=>pct(total?params.value/total:null),color:"#d9e6f3",fontSize:11,fontWeight:600}}]
    },true);
    chart.off("click");
    chart.on("click",params=>{if(CHANNELS.includes(params.name))filterThrough("channel",params.name);});
  }

  function renderTable(rows) {
    const items=groupBy(rows,"product").sort((a,b)=>b.written-a.written);
    const total=aggregate(rows);
    const body=document.getElementById("details-body");
    body.replaceChildren();
    items.forEach(item=>{
      const tr=document.createElement("tr");
      const product=document.createElement("td");
      const button=document.createElement("button");
      button.type="button";button.className="table-select";button.dataset.product=item.key;
      button.title="Filtrar produto: "+item.key;
      const swatch=document.createElement("span");swatch.className="product-swatch";swatch.style.backgroundColor=COLORS[item.key];swatch.setAttribute("aria-hidden","true");
      button.append(swatch,document.createTextNode(item.key));product.appendChild(button);tr.appendChild(product);
      const cols=[money(item.written),money(item.earned),money(item.claims),pct(item.lossRatio),pct(item.combined),money(item.result)];
      cols.forEach((value,index)=>{
        const td=document.createElement("td");td.textContent=value;
        if(index===5)td.className="strong "+(item.result<0?"negative":"positive");
        if(index===4&&item.combined>1)td.className="negative";
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    const footer=document.createElement("tr");footer.className="total-row";
    [ "TOTAL",money(total.written),money(total.earned),money(total.claims),pct(total.lossRatio),pct(total.combined),money(total.result) ].forEach((value,index)=>{
      const td=document.createElement("td");td.textContent=value;
      if(index===0||index===6)td.className="strong";
      footer.appendChild(td);
    });
    body.appendChild(footer);
  }

  function renderInsights(rows,current,prior,yoy) {
    const list=document.getElementById("insights-list");
    list.replaceChildren();
    const products=groupBy(rows,"product").sort((a,b)=>b.written-a.written);
    const messages=[];
    if(products.length){
      messages.push("Maior volume: "+products[0].key+" representa "+pct(current.written?products[0].written/current.written:null)+" da produção no recorte selecionado.");
      const worst=products.slice().sort((a,b)=>b.combined-a.combined)[0];
      messages.push("Atenção à rentabilidade: "+worst.key+" registra combinado de "+pct(worst.combined)+(worst.combined>=1?", acima do ponto de equilíbrio técnico.":", abaixo do limite de 100%."));
    }
    if(yoy==null)messages.push("Comparação anual indisponível para este intervalo; altere o período para avaliar o crescimento YoY.");
    else messages.push("Produção "+(yoy>=0?"cresceu ":"recuou ")+pct(Math.abs(yoy))+" em relação à mesma janela do ano anterior ("+money(prior.written)+" de base comparativa).");
    messages.forEach(message=>{const li=document.createElement("li");li.textContent=message;list.appendChild(li);});
  }

  function render() {
    const months=monthsForPeriod(state.period);
    const rows=filteredRows(months);
    const current=aggregate(rows);
    const prevMonths=months.map(priorMonth);
    const hasPrior=state.period!=="all"&&prevMonths.every(key=>MONTHS.includes(key));
    const prior=hasPrior?aggregate(filteredRows(prevMonths)):null;
    const yoy=prior&&prior.written>0?current.written/prior.written-1:null;

    setText("filter-status",labelMonth(months[0])+" – "+labelMonth(months[months.length-1])+" • "+current.count.toLocaleString("pt-BR")+" registros");
    setText("kpi-premium",money(current.written));
    setText("kpi-premium-detail",money(current.earned)+" em prêmios ganhos");
    setText("kpi-loss",pct(current.lossRatio));
    setText("kpi-combined",pct(current.combined));
    setText("kpi-combined-detail",current.combined==null?"—":current.combined<1?"Margem técnica positiva":"Atenção: acima de 100%");
    setText("kpi-result",money(current.result));
    setText("kpi-yoy",yoy==null?"N/D":(yoy>0?"+":"")+pct(yoy));
    setText("kpi-yoy-detail",hasPrior?"Mesmo intervalo do ano anterior":"Sem base anual comparável");
    setTone("kpi-result",current.result>=0?"positive":"negative");
    setTone("kpi-combined",current.combined<1?"positive":"negative");
    setTone("kpi-yoy",yoy==null?"":yoy>=0?"positive":"negative");

    renderTable(rows);
    renderInsights(rows,current,prior,yoy);
    if(window.echarts){
      renderTrend(rows,months);
      renderMix(rows);
      renderPerformance(rows);
      renderRegions(rows);
      renderChannels(rows);
    }
  }

  function exportCSV() {
    const rows=filteredRows(monthsForPeriod(state.period));
    const columns=["Competência","Produto","Região","Canal","Prêmio emitido (R$)","Prêmio ganho (R$)","Sinistros (R$)","Despesas administrativas (R$)","Comissões (R$)","Resultado técnico (R$)"];
    const decimal=value=>value.toFixed(2).replace(".",",");
    const lines=[columns.join(";")];
    rows.forEach(row=>lines.push([row.month,row.product,row.region,row.channel,decimal(row.written),decimal(row.earned),decimal(row.claims),decimal(row.expenses),decimal(row.commissions),decimal(row.result)].join(";")));
    const blob=new Blob(["\uFEFF"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"});
    const objectURL=URL.createObjectURL(blob);
    const link=document.createElement("a");
    link.href=objectURL;link.download="executive-portfolio-"+state.period+".csv";
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(objectURL),1000);
  }

  function init() {
    [["product",PRODUCTS],["region",REGIONS],["channel",CHANNELS]].forEach(entry=>{
      const select=document.getElementById(entry[0]+"-filter");
      entry[1].forEach(value=>{const option=document.createElement("option");option.value=value;option.textContent=value;select.appendChild(option);});
    });
    ["period","product","region","channel"].forEach(name=>{
      const control=document.getElementById(name+"-filter");
      control.addEventListener("change",()=>{
        state[name]=control.value;
        render();
      });
    });
    document.getElementById("reset-filters").addEventListener("click",()=>{
      state.period="last12";state.product="all";state.region="all";state.channel="all";
      ["period","product","region","channel"].forEach(name=>{document.getElementById(name+"-filter").value=state[name];});
      render();
    });
    document.getElementById("export-csv").addEventListener("click",exportCSV);
    document.getElementById("details-body").addEventListener("click",event=>{
      const button=event.target.closest("button[data-product]");
      if(button)filterThrough("product",button.dataset.product);
    });
    setText("year",new Date().getFullYear());
    if(!window.echarts)showFallback("Os demais indicadores e o CSV continuam disponíveis.");
    render();
    if(window.echarts){
      let resizePending=false;
      window.addEventListener("resize",()=>{
        if(resizePending)return;
        resizePending=true;
        requestAnimationFrame(()=>{
          Object.values(chartInstances).forEach(chart=>chart.resize());
          resizePending=false;
        });
      });
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();
