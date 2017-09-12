SELECT pg2.PGrName2, pg3.PGrName3, p.Article1, p.ProdName, p.UM, m.*
FROM (
  select d.ProdID, DocName='Продажа товара оператором', SUM(d.Qty) AS TotalQty, d.RealPrice as PriceCC_wt, SUM(d.RealSum) AS TotalSum
  from t_sale s
  INNER JOIN t_SaleD d on d.CHID=s.CHID
  WHERE s.DocDate BETWEEN @BDATE AND @EDATE
  GROUP BY d.ProdID, d.RealPrice
  UNION
  select d.ProdID, DocName='Возврат товара по чеку', SUM(d.Qty) AS TotalQty, d.RealPrice as PriceCC_wt, -SUM(d.RealSum) AS TotalSum
  from t_CRRet r
  INNER JOIN t_CRRetD d on d.CHID=r.CHID
  WHERE r.DocDate BETWEEN @BDATE AND @EDATE
  GROUP BY d.ProdID, d.RealPrice
) m
INNER JOIN r_Prods p on p.ProdID= m.ProdID
INNER JOIN r_ProdG2 pg2 on pg2.PGrID2= p.PGrID2
INNER JOIN r_ProdG3 pg3 on pg3.PGrID3= p.PGrID3
ORDER BY pg2.PGrName2, pg3.PGrName3, p.Article1, p.ProdName, m.PriceCC_wt;
