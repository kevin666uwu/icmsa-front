const pattern=/^[A-Z][AEIOUX][A-Z]{2}\d{6}[HMX](?:AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/;
export function curpError(value,birthDate){
 const curp=value.trim().toUpperCase();
 if(!pattern.test(curp))return 'La CURP debe tener 18 caracteres y una estructura válida.';
 const year=(/\d/.test(curp[16])?1900:2000)+Number(curp.slice(4,6)),month=Number(curp.slice(6,8)),day=Number(curp.slice(8,10));
 const date=new Date(Date.UTC(year,month-1,day));
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day||date>new Date())return 'La fecha contenida en la CURP no es válida.';
 const encoded=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
 if(birthDate&&birthDate!==encoded)return 'La CURP no coincide con la fecha de nacimiento capturada.';
 const alphabet='0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
 const sum=[...curp.slice(0,17)].reduce((total,char,index)=>total+alphabet.indexOf(char)*(18-index),0);
 if((10-sum%10)%10!==Number(curp[17]))return 'Revisa el dígito verificador de la CURP.';
 return '';
}
