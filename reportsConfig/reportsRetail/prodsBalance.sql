SELECT r.ProdID, p.ProdName, p.UM, p.Article1, r.StockID, s.StockName, SUM(r.Qty) as Qty
from   t_Rem r
inner join r_Prods p on p.ProdID = r.ProdID
inner join r_Stocks s on s.StockID=r.StockID
where r.Qty<>0 and ','+@Stock+',' like '%,'+convert(varchar(10),r.StockID)+',%'
group by r.StockID, r.ProdID, s.StockName, p.Article1, p.ProdName, p.UM
order by p.ProdName, r.StockID;