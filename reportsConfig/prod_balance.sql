SELECT s.StockName, p.Article1, p.ProdName, p.UM, SUM(r.Qty) as Qty
from   t_Rem r
inner join r_Prods p on p.ProdID = r.ProdID
inner join r_Stocks s on s.StockID=r.StockID
where r.StockID=@StockID
GROUP by s.StockName,p.ProdName, p.Article1,p.UM
HAVING SUM(r.Qty)<>0;