
SELECT *
FROM
(
select  c.PCatName, DocName='Продажа товара оператором', SUM(d.Qty) AS TotalQty, SUM(d.RealSum) AS TotalSum
from t_sale s
  INNER JOIN t_SaleD d on d.CHID=s.CHID
  INNER JOIN r_Prods p on p.ProdID= d.ProdID
  INNER JOIN r_ProdC c on c.PCatID=p.PCatID
WHERE s.DocDate  BETWEEN @BDATE AND @EDATE
GROUP BY c.PCatName

UNION
select  c.PCatName,DocName='Возврат товара по чеку', SUM(d.Qty) AS TotalQty, -SUM(d.RealSum) AS TotalSum
from t_CRRet r
  INNER JOIN t_CRRetD d on d.CHID=r.CHID
  INNER JOIN r_Prods p on p.ProdID= d.ProdID
  INNER JOIN r_ProdC c on c.PCatID=p.PCatID
WHERE r.DocDate  BETWEEN @BDATE AND @EDATE
GROUP BY c.PCatName
) m

ORDER BY m.PCatName;