import React from "react";
import QrCode from "qrcode.react";

const QRGenerate = props => (
  <QrCode
    value={props.value}
    fgColor={props.fgColor}
    size={props.size ? props.size : 256}
  />
);

export default QRGenerate;
