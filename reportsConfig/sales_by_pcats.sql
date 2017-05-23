select  c.PCatName, SUM(d.Qty) AS TotalQty, SUM(d.RealSum) AS TotalSum
from t_sale s
  INNER JOIN t_SaleD d on d.CHID=s.CHID
  INNER JOIN r_Prods p on p.ProdID= d.ProdID
  INNER JOIN r_ProdC c on c.PCatID=p.PCatID
WHERE s.DocDate  BETWEEN @BDATE AND @EDATE
GROUP BY c.PCatName
ORDER BY c.PCatName;