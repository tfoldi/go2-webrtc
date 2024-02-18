// import { MD5} from './md5.js';


function hexToBase64(r) {
  var o;
  const n =
    (o = r.match(/.{1,2}/g)) == null ? void 0 : o.map((s) => parseInt(s, 16));
  return window.btoa(String.fromCharCode.apply(null, n));
}

export const encryptKey = (r) => {
  const n = `UnitreeGo2_${r}`,
    o = encryptByMd5(n);
  return hexToBase64(o);
};

function encryptByMd5(r) {
  return md5(r).toString();
}
