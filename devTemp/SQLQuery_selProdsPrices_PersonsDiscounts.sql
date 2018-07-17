--select * from r_ProdG3

--select * from r_Prods where UID='2a9bd76b-dc29-11e7-b2af-00155d0f1f01'

select --p.ChID,
		p.ProdName,p.UM, p.Article1, p.Notes, p.ProdID, p.UID
		--,p.Country--
		--, p.PCatID,p.PGrID, p.Article2 --,p.Article3, p.Weight,p.Age, p.PriceWithTax, p.Note1,p.Note2,p.Note3
		--,p.InRems, p.IsDecQty,p.InStopList,p.CstProdCode,p.TaxTypeID
		--,pmq.UM,pmq.BarCode, pip.PPID, pip.ProdDate
		, PriceMC=pmp1.PriceMC, /*pmp1.CurrID, pmp1.Notes,*/ PriceMC1=pmp2.PriceMC/*, pmp2.CurrID, pmp2.Notes*/
		,PersonsDiscount=pd.Discount, pdt.PersonDiscountTypeName
	from r_Prods p
	inner join r_ProdG3 pg3 on pg3.PGrID3=p.PGrID3	--select * from r_ProdG3
	left join r_ProdMQ pmq on pmq.ProdID=p.ProdID
	left join t_PInP pip on pip.ProdID=p.ProdID and pip.PPID=0
	left join r_ProdMP pmp1 on pmp1.ProdID=p.ProdID and pmp1.PLID=0
	left join r_ProdMP pmp2 on pmp2.ProdID=p.ProdID and pmp2.PLID=1
	left join ir_PersonsDiscounts pd on pd.PGrID3=p.PGrID3 --and pd.PersonDiscountTypeID=5		--select * from ir_PersonsDiscounts
	left join ir_PersonDiscountTypes pdt on pdt.PersonDiscountTypeID=pd.PersonDiscountTypeID	--select * from ir_PersonDiscountTypes
	order by p.ProdID, pmq.Barcode

--select dc.DCardID,dc.Notes,dc.Note1, p.PhoneHome,p.PLID,p.PersonDiscountTypeID from r_DCards dc,r_PersonDC pdc,r_Persons p where dc.DCardID='2709000000017' and pdc.DCardChID=dc.ChID and p.PersonID=pdc.PersonID