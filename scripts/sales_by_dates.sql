select p.ProdName, d.PriceCC_wt, d.Qty, d.SumCC_wt
from t_sale s
INNER JOIN t_SaleD d on d.CHID=s.CHID
INNER JOIN r_Prods p on p.ProdID= d.ProdID
WHERE s.DocDate BETWEEN @BDATE AND @EDATE ;