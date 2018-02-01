SELECT c.PCatName, m.DocName, m.TotalQty, m.TotalSum
FROM (
    select s.StockID, p.PCatID, DocName='Продажа товара оператором', SUM(d.Qty) AS TotalQty, SUM(d.RealSum) AS TotalSum
    from t_sale s
    INNER JOIN t_SaleD d on d.CHID=s.CHID
    INNER JOIN r_Prods p on p.ProdID= d.ProdID
    WHERE s.DocDate  BETWEEN @BDATE AND @EDATE
    GROUP BY s.StockID, p.PCatID
    UNION
    select r.StockID, p.PCatID, DocName='Возврат товара по чеку', SUM(d.Qty) AS TotalQty, -SUM(d.RealSum) AS TotalSum
    from t_CRRet r
    INNER JOIN t_CRRetD d on d.CHID=r.CHID
    INNER JOIN r_Prods p on p.ProdID= d.ProdID
    WHERE r.DocDate  BETWEEN @BDATE AND @EDATE
    GROUP BY r.StockID, p.PCatID
) m
INNER JOIN r_ProdC c on c.PCatID=m.PCatID
ORDER BY c.PCatName;