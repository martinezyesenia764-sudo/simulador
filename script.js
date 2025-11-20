// INPUT VALIDATIONS
document.getElementById("ident").addEventListener("input", e => {
  e.target.value = e.target.value.replace(/[^0-9A-Fa-f]/g, "").toUpperCase().slice(0,4);
});

document.getElementById("flags").addEventListener("input", e => {
  e.target.value = e.target.value.replace(/[^01]/g, "").slice(0,3);
});

document.getElementById("fragOff").addEventListener("input", e => {
  e.target.value = e.target.value.replace(/[^0]/g, "").slice(0,13);
});

document.getElementById("ttl").addEventListener("input", e => {
  let val = parseInt(e.target.value) || 0;
  e.target.value = Math.max(0, Math.min(255, val));
});

document.getElementById("checksum").addEventListener("input", e => {
  e.target.value = e.target.value.replace(/[^0-9A-Fa-f]/g,"").toUpperCase().slice(0,4);
});

function ipInputHandler(e){
  let val = e.target.value.replace(/[^0-9.]/g,"");
  const octets = val.split(".").slice(0,4).map(o=>{
    if(o==="") return o;
    let n = parseInt(o) || 0;
    return Math.min(n,255);
  });
  e.target.value = octets.join(".");
}
document.getElementById("ipSrc").addEventListener("input", ipInputHandler);
document.getElementById("ipDst").addEventListener("input", ipInputHandler);

const optionsInput = document.getElementById("options");
const ihlInput = document.getElementById("ihl");

function checkOptionsField() {
  const ihlValue = parseInt(ihlInput.value) || 5;
  optionsInput.disabled = ihlValue === 5;
  if(ihlValue === 5) optionsInput.value = "";
}

ihlInput.addEventListener("input", e => {
  let val = parseInt(e.target.value);
  val = Math.max(5, Math.min(15, val));
  e.target.value = val;
  checkOptionsField();
});

checkOptionsField();

optionsInput.addEventListener("input", e => {
  if (!optionsInput.disabled) {
    e.target.value = e.target.value.replace(/[^0-9A-Fa-f]/g,"").toUpperCase();
  }
});

// RANDOM BUTTONS
function genIdent(){
  const hex="0123456789ABCDEF";
  let val="";
  for(let i=0;i<4;i++) val+=hex[Math.floor(Math.random()*16)];
  document.getElementById("ident").value=val;
}
function genFlags(){
  document.getElementById("flags").value=[...Array(3)].map(()=>Math.random()<0.5?"0":"1").join("");
}
function genFrag(){
  document.getElementById("fragOff").value="0".repeat(13);
}
function genChecksum(){
  const hex="0123456789ABCDEF";
  let val="";
  for(let i=0;i<4;i++) val+=hex[Math.floor(Math.random()*16)];
  document.getElementById("checksum").value=val;
}

// GENERATE DATAGRAM
function generarDatagrama(){
  const version=4;
  let ihl=parseInt(document.getElementById("ihl").value)||5;
  const tos=parseInt(document.getElementById("tos").value,16)||0;
  const identificacion=document.getElementById("ident").value.padStart(4,'0');
  const flags=document.getElementById("flags").value.padStart(3,'0');
  const fragOffset=parseInt(document.getElementById("fragOff").value)||0;
  const ttl=parseInt(document.getElementById("ttl").value)||64;
  const protocolo=parseInt(document.getElementById("protocol").value,16)||1;
  const ipSrc=document.getElementById("ipSrc").value || "192.168.0.2";
  const ipDst=document.getElementById("ipDst").value || "192.168.0.2";
  let opciones=document.getElementById("options").value || "";
  const datos=document.getElementById("data").value || "hola";

  const toHex=(num,size=2)=>num.toString(16).toUpperCase().padStart(size,'0');
  const ipToHex=ip=>ip.split('.').map(o=>toHex(parseInt(o))).join(' ');

  if(opciones.length%8!==0) opciones+="0".repeat(8-(opciones.length%8));
  ihl=5+opciones.length/8;
  const totalLength = ihl*4+datos.length;
  const versionIHL=(version<<4)+ihl;
  const flagsBits=parseInt(flags,2)<<13;
  const fragAndFlags = flagsBits+fragOffset;

  const headerFields=[
    toHex(versionIHL),
    toHex(tos),
    toHex(totalLength>>8), toHex(totalLength&0xFF),
    identificacion.slice(0,2), identificacion.slice(2,4),
    toHex(fragAndFlags>>8), toHex(fragAndFlags&0xFF),
    toHex(ttl),
    toHex(protocolo),
    "00","00",
    ipToHex(ipSrc),
    ipToHex(ipDst)
  ];

  const opcionesHex=opciones.match(/.{1,2}/g)?.join(" ").toUpperCase()||"";

  function calcularChecksum(headerBytes){
    let sum=0;
    for(let i=0;i<headerBytes.length;i+=2){
      const word=(parseInt(headerBytes[i],16)<<8)+parseInt(headerBytes[i+1],16);
      sum+=word;
      while(sum>0xFFFF) sum=(sum&0xFFFF)+(sum>>16);
    }
    return (~sum & 0xFFFF).toString(16).toUpperCase().padStart(4,'0');
  }

  let headerArray=[...headerFields];
  if(opcionesHex) headerArray.push(...opcionesHex.split(" "));

  const realChecksum=calcularChecksum(headerArray);
  headerFields[10]=realChecksum.slice(0,2);
  headerFields[11]=realChecksum.slice(2,4);

  const datosHex=datos.split("").map(ch=>toHex(ch.charCodeAt(0))).join(" ");
  const headerHex=[...headerFields,opcionesHex].filter(x=>x.trim()!=="").join(" ").toUpperCase();
  const datagramaCompleto=`${headerHex} ${datosHex}`;

  document.getElementById("resultado").innerText=
    `Encabezado IPv4\n${headerHex}\n\nDatos\n${datosHex}\n\nDatagrama completo\n${datagramaCompleto}`;
}
