select m.StockID, m.ProdID, m.DocDate, st.StockName, pc.PCatName, p.Article1, p.ProdName,p.UM, m.PriceCC_wt,
    SUM(m.SaleQty) as SaleQty, SUM(m.RetQty) as RetQty, SUM(ISNULL(m.SaleQty,0)+ISNULL(m.RetQty,0) )as TotalQty, 
    SUM(m.SaleSum) as SaleSum, SUM(m.RetSum) as RetSum, SUM(ISNULL(m.SaleSum,0)+ISNULL(m.RetSum,0)) as TotalSum
from (
   select DocName='Продажа товара оператором', s.DocDate , s.StockID, d.ProdID, d.RealPrice as PriceCC_wt, SUM(d.Qty) as SaleQty, NULL as RetQty, SUM(d.RealSum) as SaleSum, NULL as RetSum
   from t_sale s
   INNER JOIN t_SaleD d on d.CHID=s.CHID
   WHERE s.DocDate BETWEEN @BDATE AND @EDATE AND s.StockID=@StockID
   GROUP BY s.StockID, s.DocDate, d.ProdID, d.RealPrice
   UNION
   select DocName='Возврат товара по чеку', r.DocDate, r.StockID, d.ProdID, d.RealPrice as PriceCC_wt, NULL as SaleQty, -SUM(d.Qty) as RetQty, NULL as SaleSum, -SUM(d.RealSum) as RetSum
   from t_CRRet r
   INNER JOIN t_CRRetD d on d.CHID=r.CHID
   WHERE r.DocDate BETWEEN @BDATE AND @EDATE AND r.StockID=@StockID
   GROUP BY r.StockID, r.DocDate, d.ProdID, d.RealPrice
   ) m
INNER JOIN r_Stocks st on st.StockID=m.StockID
INNER JOIN r_Prods p on p.ProdID= m.ProdID
INNER JOIN r_ProdC pc on pc.PCatID= p.PCatID
GROUP BY m.StockID, m.ProdID, m.DocDate, st.StockName, pc.PCatName, p.Article1, p.ProdName,p.UM, m.PriceCC_wt
ORDER  by m.DocDate, pc.PCatName, p.Article1;
