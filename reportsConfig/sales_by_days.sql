select  pg2.PGrName2, pg3.PGrName3, p.Article1, p.ProdName, p.UM, m.*
from (
   select  d.ProdID,s.DocDate , DocName='Продажа товара оператором', SUM(d.Qty) AS TotalQty, d.RealPrice as PriceCC_wt, SUM(d.RealSum) AS TotalSum
   from t_sale s
   INNER JOIN t_SaleD d on d.CHID=s.CHID
   WHERE s.DocDate BETWEEN @BDATE AND @EDATE
   GROUP BY s.DocDate ,d.ProdID, d.RealPrice
   UNION
   select d.ProdID,r.DocDate,DocName='Возврат товара по чеку',  SUM(d.Qty) AS TotalQty, d.RealPrice as PriceCC_wt, -SUM(d.RealSum) AS TotalSum
   from t_CRRet r
   INNER JOIN t_CRRetD d on d.CHID=r.CHID
   WHERE r.DocDate BETWEEN @BDATE AND @EDATE
   GROUP BY r.DocDate, d.ProdID, d.RealPrice
) m
INNER JOIN r_Prods p on p.ProdID= m.ProdID
INNER JOIN r_ProdG2 pg2 on pg2.PGrID2= p.PGrID2
INNER JOIN r_ProdG3 pg3 on pg3.PGrID3= p.PGrID3
ORDER  by m.DocDate, pg2.PGrName2, pg3.PGrName3, p.Article1;
