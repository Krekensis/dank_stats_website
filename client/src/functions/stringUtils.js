export const commas = (number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export const titleCase = (str) => {
  return str.toLowerCase().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export const formatLargeNumber = (num) => {
  if (num === null || num === undefined) return '';
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (absNum >= 1.0e+9) {
    return sign + (absNum / 1.0e+9).toFixed(2).replace(/\.00$/, '') + "B";
  } else if (absNum >= 1.0e+6) {
    return sign + (absNum / 1.0e+6).toFixed(2).replace(/\.00$/, '') + "M";
  } else if (absNum >= 1.0e+3) {
    return sign + (absNum / 1.0e+3).toFixed(2).replace(/\.00$/, '') + "k";
  } else {
    return num.toString();
  }
}