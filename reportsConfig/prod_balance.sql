SELECT s.StockName, p.Article1, p.ProdName, p.UM, r.Qty
from   t_Rem r
inner join r_Prods p on p.ProdID = r.ProdID
inner join r_Stocks s on s.StockID=r.StockID
where r.StockID=@StockID;