// Colors.js
class Colors {
    constructor() {
        const hex = [
            "FF3838",
            "2C99A8",
            "FF701F",
            "6473FF",
            "CFD231",
            "48F90A",
            "92CC17",
            "3DDB86",
            "1A9334",
            "00D4BB",
            "FF9D97",
            "00C2FF",
            "344593",
            "FFB21D",
            "0018EC",
            "8438FF",
            "520085",
            "CB38FF",
            "FF95C8",
            "FF37C7"
        ];
        this.palette = hex.map(c => this.hexToRgb("#" + c));
        this.n = this.palette.length;
    }

    hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r, g, b];
    }

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    call(ind) {
        const colorCodes = this.palette[ind % this.n];
        return this.rgbToHex(colorCodes[0], colorCodes[1], colorCodes[2]);
    }
}

export default Colors;
