import * as PImage from "pureimage"
import * as fs from 'fs'



// Standard starting pattern for a 17x17 M4 micro qr code
let m4qr = [
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
    [1,0,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0],
    [1,0,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0],
    [1,0,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
    [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];
let seq = {
    0: [8,1],
    1: [8,2],
    2: [8,3],
    3: [8,4],
    4: [8,5],
    5: [8,6],
    6: [8,7],
    7: [8,8],
    8: [7,8],
    9: [6,8],
    10: [5,8],
    11: [4,8],
    12: [3,8],
    13: [2,8],
    14: [1,8],
}

const DIRECTIONS = {
    UP: "UP",
    DOWN: "DOWN"
}

class Cursor {
    constructor(){
        this.dir = DIRECTIONS.UP;
        this.loc = [16,16];
        this.origin = [16,16];
    }

    next() {
        console.log(`cursor location: ${this.loc}\nOrigin: ${this.origin}\nCursor direction: ${this.dir}`)
        if(this.dir === DIRECTIONS.UP){

            if(this.loc[0] === this.origin[0]){
                this.loc[0]-= 1;
            } else {
                if(reservedSpace(this.loc[0] + 1, this.loc[1] - 1)){
                    console.log(`Hit top`)
                    this.loc[0] -= 1;
                    this.dir = DIRECTIONS.DOWN;
                    this.setOrigin();
                } else {
                    this.loc[0]+= 1;
                    this.loc[1]-= 1;
                }
            }

        } else if(this.dir === DIRECTIONS.DOWN){

            if(this.loc[0] === this.origin[0]){
                this.loc[0]-= 1;
            } else {
                if(reservedSpace(this.loc[0] + 1, this.loc[1] + 1)){
                    this.loc[0] -= 1;
                    this.dir = DIRECTIONS.UP;
                    this.setOrigin();
                } else {
                    this.loc[0]+= 1;
                    this.loc[1]+= 1;
                }
            }

        }
    }
    setOrigin(){
        this.origin[0] = this.loc[0];
        this.origin[1] = this.loc[1];
    }
    x() {
        return this.loc[0];
    }
    y() {
        return this.loc[1];
    }
}



/*
    Mask patterns:
    00: i mod 2 = 0;
    01: ((i div 2) + (j div 3)) mod 2 = 0
    10: ((i j) mod 2 + (i j) mod 3) mod 2 = 0

*/

function main() {
    let message = process.argv.slice(2)[0];
                    //  Format info: [b,b,b,b,b] + error correction info: [b,b,b,b,b,b,b,b,b,b,b]
    let formatting =    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0]
    let mask =          [1,0,0,0,1,0,0,0,1,0,0,0,1,0,1]
                    //  Sample xor: [0,0,1,0,1,0,0,0,1,0,0,0,1,0,1]
    let type = [0, 1, 0];

    XORBitArray(formatting, mask);



    if(!message){
        console.log("Message missing.");
        return -1;
    }

    if(message.length > 15){
        console.log(`Your message: '${message}' is greater than 15 characters.\n Micro QR codes cannot store that much data.`)
        return -1;
    } else if (message.length === 0){
        console.log("missing message");
        return -1;
    }

    // set formatting bits
    formatting.slice().reverse().forEach((bit, index) => {
        writeBit(m4qr, seq[index][0], seq[index][1], bit);
    })

    // get ascii array from message

    let ascii = [];

    [...message].forEach(char => {
        // convert to string of bits, adding leading zeroes when needed
        ascii.push(char.charCodeAt(0).toString(2).padStart(8, "0"));
    });
    
    let lengthBits = ascii.length.toString(2).padStart(5,'0');
    console.log(lengthBits);

    let cur = new Cursor();
    console.log("Setting type bits:");
    // set type bits
    [...type].forEach(bit => {
        writeBit(m4qr, cur.x(), cur.y(), Number(bit));
        cur.next();
    });
    console.log("Setting length bits:");
    // set bits for length
    [...lengthBits].forEach(bit => {
        writeBit(m4qr, cur.x(), cur.y(), Number(bit));
        cur.next();
    });

    console.log("Setting character bits");
    // set character bits

    for(const bitString of ascii){
        //cur.setOrigin();
        [...bitString].forEach(bit => {
            writeBit(m4qr, cur.x(), cur.y(), Number(bit));
            cur.next();
        });
    }

    // Flip bits according to mask

    // for(let y = 0; y < m4qr.length; y++){
    //     for(let x = 0; x < m4qr.length; x++){

    //         if(!reservedSpace(x,y)){
    //             writeBit(m4qr,x,y, (y % 2) ^ readBit(m4qr,x,y));
    //         }

    //     }
    // }



    generateQRImage('qr',m4qr)


}

main();




function generateQRImage( fileName, qrArray) {




    const SIZE = qrArray.length;
    const qr = PImage.make(SIZE, SIZE);
    const context = qr.getContext('2d');

    //Fill image with white
    context.fillStyle = 'white';
    context.fillRect(0,0,SIZE,SIZE);

    context.fillStyle = 'black';

    qrArray.forEach((row , i) => {
        row.forEach((col, j) => {
            if(col === 1){
                context.fillPixel(j,i);
            }
        })
    })

    PImage.encodePNGToStream(qr, fs.createWriteStream(`${fileName}.png`)).then(() => {
        console.log(`created qr code image: ${fileName}.png`);
    }).catch(e => {
        console.log(`error creating ${fileName}.png`);
    })
    console.log("outputting qr image");


}
function reservedSpace(x, y) {
    return (x <= 0 || y <= 0 || (x <= 8 && y <= 8) || x >= 17 || y >= 17);
}
function writeBit(arr ,x, y, value) {
    arr[y][x] = value;
}
function readBit(arr, x, y){
    return arr[y][x];
}

function XORBitArray(arr1, arr2){
    arr1.forEach((bit, index) => {
        if(arr2[index] === arr1[index]){
            arr1[index] = 0;
        } else {
            arr1[index] = 1;
        }
    })
}