// Graphique « Accuracy by module » du Profil, sorti de Profile.jsx pour être chargé à la
// demande (Phase 5, C9). recharts (~200 Ko) ne quitte le bundle principal que si ses deux
// consommateurs — TeacherDash (déjà lazy) et ce bloc — sont différés. L'onglet Profile, lui,
// reste chargé d'avance : seul le graphique attend son chunk, à hauteur réservée.
// Rendu identique au bloc d'origine (Profile.jsx, « ACCURACY BY MODULE »).
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar as RBar, Cell } from "recharts";

export function ProfileCharts(p){
  var active=p.active;
  return(
    <ResponsiveContainer width="100%" height={Math.max(160,active.length*32)}>
      <BarChart data={active} layout="vertical" margin={{top:0,right:16,left:4,bottom:0}}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--bdr)" horizontal={false}/>
        <XAxis type="number" domain={[0,100]} tick={{fill:"var(--t3)",fontSize:10}} axisLine={{stroke:"var(--bdr)"}} tickLine={false} unit="%"/>
        <YAxis type="category" dataKey="name" width={100} tick={{fill:"var(--t2)",fontSize:10}} axisLine={false} tickLine={false}/>
        <Tooltip formatter={function(v){return v+"%";}} contentStyle={{background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:8,fontSize:12}} labelStyle={{color:"var(--t1)",fontWeight:700}} itemStyle={{color:"var(--t1)"}} cursor={{fill:"rgba(180,140,80,0.06)"}}/>
        <RBar dataKey="accuracy" radius={[0,6,6,0]} barSize={18}>
          {active.map(function(entry,i){
            var col=entry.accuracy>=70?"#4abe60":entry.accuracy>=50?"#ff8c42":"#e05252";
            return(<Cell key={i} fill={col}/>);
          })}
        </RBar>
      </BarChart>
    </ResponsiveContainer>);
}
