SELECT m.StockID, m.PCatID, st.StockName,  c.PCatName, 
    SUM(m.SaleQty) as SaleQty, SUM(m.RetQty) as RetQty, SUM(ISNULL(m.SaleQty,0)+ISNULL(m.RetQty,0) )as TotalQty, 
    SUM(m.SaleSum) as SaleSum, SUM(m.RetSum) as RetSum, SUM(ISNULL(m.SaleSum,0)+ISNULL(m.RetSum,0)) as TotalSum
FROM (
    select  DocName='Продажа товара оператором', s.StockID, p.PCatID, SUM(d.Qty) AS SaleQty, NULL as RetQty, SUM(d.RealSum) AS SaleSum, NULL as RetSum
    from t_sale s
        INNER JOIN t_SaleD d on d.CHID=s.CHID
        INNER JOIN r_Prods p on p.ProdID= d.ProdID
        WHERE s.DocDate  BETWEEN @BDATE AND @EDATE AND s.StockID=@StockID
        GROUP BY s.StockID, p.PCatID
    UNION
    select  DocName='Возврат товара по чеку', r.StockID, p.PCatID, NULL as SaleQty, -SUM(d.Qty) AS RetQty, NULL as SaleQty, -SUM(d.RealSum) AS RetSum
    from t_CRRet r
        INNER JOIN t_CRRetD d on d.CHID=r.CHID
        INNER JOIN r_Prods p on p.ProdID= d.ProdID
    WHERE r.DocDate  BETWEEN @BDATE AND @EDATE AND r.StockID=@StockID
    GROUP BY r.StockID, p.PCatID
) m
INNER JOIN r_Stocks st on st.StockID=m.StockID
INNER JOIN r_ProdC c on c.PCatID=m.PCatID
GROUP BY m.StockID, m.PCatID, st.StockName, c.PCatName
ORDER BY st.StockName, c.PCatName;