const RS = require('./node_modules/reedsolomon/reedsolomon.js');



let ec = RS.ReedSolomonEncoder(RS.QR_CODE_FIELD_256);

let ascii = [];

    [..."Hello"].forEach(char => {
        // convert to string of bits, adding leading zeroes when needed
        let bstring = (char.charCodeAt(0).toString(2).padStart(8, "0"));
        [...bstring].forEach(bit => {
            ascii.push(bit === "1");
        })
    });
console.log(ascii);
ec.encode()