select pg2.PGrName2, pg3.PGrName3, p.Article1, p.ProdName,p.UM,  SUM(d.Qty) AS TotalQty, d.RealPrice as PriceCC_wt, SUM(d.RealSum) AS TotalSum
from t_sale s
  INNER JOIN t_SaleD d on d.CHID=s.CHID
  INNER JOIN r_Prods p on p.ProdID= d.ProdID
  INNER JOIN r_ProdG2 pg2 on pg2.PGrID2= p.PGrID2
  INNER JOIN r_ProdG3 pg3 on pg3.PGrID3= p.PGrID3
WHERE s.DocDate BETWEEN @BDATE AND @EDATE
GROUP BY pg2.PGrName2, pg3.PGrName3, p.Article1, p.ProdName,p.UM,d.RealPrice
ORDER BY pg2.PGrName2, pg3.PGrName3, p.Article1, p.ProdName,d.RealPrice;
