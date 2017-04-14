
select  c.PCatName,p.UM, SUM(d.Qty) AS TotalQty, SUM(d.SumCC_wt) AS TotalSum
from t_sale s
  INNER JOIN t_SaleD d on d.CHID=s.CHID
  INNER JOIN r_Prods p on p.ProdID= d.ProdID
  INNER JOIN r_ProdC c on c.PCatID=p.PCatID
WHERE s.DocDate  BETWEEN @BDATE AND @EDATE
GROUP BY c.PCatName,p.UM
ORDER BY c.PCatName;