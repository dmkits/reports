select --p.ChID,
		p.ProdName,p.UM, p.Article1, p.Notes, p.ProdID, p.UID
		--,p.Country--
		--, p.PCatID,p.PGrID, p.Article2 --,p.Article3, p.Weight,p.Age, p.PriceWithTax, p.Note1,p.Note2,p.Note3
		--,p.InRems, p.IsDecQty,p.InStopList,p.CstProdCode,p.TaxTypeID
		,pmq.BarCode,pmq.UM BCUM  --, pip.PPID, pip.ProdDate
		, PriceMC=pmp1.PriceMC, /*pmp1.CurrID, pmp1.Notes,*/ PriceMC1=pmp2.PriceMC/*, pmp2.CurrID, pmp2.Notes*/
		,PersonsDiscount=pd.Discount, pd.PersonDiscountTypeID, pdt.PersonDiscountTypeName
	from r_Prods p
	inner join r_ProdG3 pg3 on pg3.PGrID3=p.PGrID3	--select * from r_ProdG3
	left join r_ProdMQ pmq on pmq.ProdID=p.ProdID
	left join t_PInP pip on pip.ProdID=p.ProdID and pip.PPID=0
	left join r_ProdMP pmp1 on pmp1.ProdID=p.ProdID and pmp1.PLID=0
	left join r_ProdMP pmp2 on pmp2.ProdID=p.ProdID and pmp2.PLID=1
	left join ir_PersonsDiscounts pd on pd.PGrID3=p.PGrID3 --and pd.PersonDiscountTypeID=5		--select * from ir_PersonsDiscounts
	left join ir_PersonDiscountTypes pdt on pdt.PersonDiscountTypeID=pd.PersonDiscountTypeID	--select * from ir_PersonDiscountTypes
	where p.ProdID>0 and @OnlyWithDiscount=0 or (@OnlyWithDiscount=1 and pd.PersonDiscountTypeID is not NULL)
	order by p.ProdID, pmq.Barcode, pd.PersonDiscountTypeID

