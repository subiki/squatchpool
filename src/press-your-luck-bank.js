/** Bank/kick proof from chronological shared physics events.
 * Provisional interpretation: cue cushion before first cue–8 contact is a kick;
 * 8 cushion after cue–8 contact and before the 8 drops is a bank.
 * Declaration and called-pocket correctness are enforced by the controller.
 */
export function qualifyingBankOrKick(events){
 if(!Array.isArray(events))return false;
 const contactIndex=events.findIndex(e=>e.type==='contact'&&e.balls?.includes(0)&&e.balls?.includes(8));
 const pocketIndex=events.findIndex(e=>e.type==='pocket'&&e.ballId===8);
 if(contactIndex<0||pocketIndex<=contactIndex)return false;
 return events.some((e,i)=>e.type==='rail'&&
  ((e.ballId===0&&i<contactIndex)||(e.ballId===8&&i>contactIndex&&i<pocketIndex)));
}
