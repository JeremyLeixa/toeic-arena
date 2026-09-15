import { useState } from "react";
import { GIcon } from "./icons.jsx";

/* Champ mot de passe avec l'œil qui bascule l'affichage (demande de Jérémy, 2026-09-15).
 * Tous les props (value, onChange, placeholder, autoComplete, onKeyDown, disabled, style…)
 * passent tels quels à l'<input> ; seul `type` est piloté ici. Le `marginBottom` du style
 * est reporté sur le conteneur pour que l'espacement des formulaires ne bouge pas, et le
 * padding droit du champ laisse la place au bouton. Le bouton est hors tabulation
 * (tabIndex -1) : Tab va du champ au suivant, comme avant. labelShow / labelHide :
 * libellés d'accessibilité, en français par défaut (écrans mot de passe = FR). */
export function PasswordInput(p){
  var[show,setShow]=useState(false);
  var rest=Object.assign({},p);delete rest.style;delete rest.labelShow;delete rest.labelHide;
  var style=p.style||{};
  var mb=style.marginBottom===undefined?0:style.marginBottom;
  var inputStyle=Object.assign({},style,{paddingRight:44,marginBottom:0});
  var label=show?(p.labelHide||"Masquer le mot de passe"):(p.labelShow||"Afficher le mot de passe");
  return(<div style={{position:"relative",marginBottom:mb}}>
    <input {...rest} type={show?"text":"password"} style={inputStyle}/>
    <button type="button" tabIndex={-1} aria-label={label} title={label} aria-pressed={show}
      onClick={function(){setShow(!show);}}
      style={{position:"absolute",right:6,top:0,bottom:0,margin:"auto 0",width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:"none",padding:0,cursor:"pointer",color:show?"var(--cyan)":"var(--t3)"}}>
      <GIcon name={show?"semi-closed-eye":"eyeball"} size={20}/>
    </button>
  </div>);
}
