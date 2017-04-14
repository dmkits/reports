
select p.ProdName,p.UM,  SUM(d.Qty) AS TotalQty, d.PriceCC_wt, SUM(d.SumCC_wt) AS TotalSum
from t_sale s
  INNER JOIN t_SaleD d on d.CHID=s.CHID
  INNER JOIN r_Prods p on p.ProdID= d.ProdID
WHERE s.DocDate BETWEEN @BDATE AND @EDATE
GROUP BY p.ProdName,p.UM,d.PriceCC_wt
ORDER BY p.ProdName,d.PriceCC_wt;