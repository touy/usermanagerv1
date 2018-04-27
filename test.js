let taxes=[];
for(i=0;i<1000*1000;i++){
  let tax={};
  tax.amount=i;
  taxes.push(tax);
}
start=new Date();
totalTaxes = taxes.reduce(function (sum, tax) {
    return sum + tax.amount;
}, 0);
end=new Date();
console.log(totalTaxes);
console.log(end-start);
totalTaxes=0;
start=new Date();
for(i=0;i<taxes.length;i++){
  totalTaxes+=taxes[i].amount;
}
end=new Date();
console.log(totalTaxes);
console.log(end-start);