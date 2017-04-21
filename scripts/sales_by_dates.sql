select s.DocDate, pg2.PGrName2, pg3.PGrName3, p.ProdName,p.UM,  SUM(d.Qty) AS TotalQty, d.PriceCC_wt, SUM(d.SumCC_wt) AS TotalSum
   from t_sale s
   INNER JOIN t_SaleD d on d.CHID=s.CHID
   INNER JOIN r_Prods p on p.ProdID= d.ProdID
   INNER JOIN r_ProdG2 pg2 on pg2.PGrID2= p.PGrID2
   INNER JOIN r_ProdG3 pg3 on pg3.PGrID3= p.PGrID3
   WHERE s.DocDate BETWEEN @BDATE AND @EDATE
   GROUP BY s.DocDate, pg2.PGrName2, pg3.PGrName3, p.ProdName,p.UM,d.PriceCC_wt
   ORDER BY s.DocDate, pg2.PGrName2, pg3.PGrName3;