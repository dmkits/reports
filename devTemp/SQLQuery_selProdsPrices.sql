--select * from r_ProdG3

--select * from r_Prods where UID='2a9bd76b-dc29-11e7-b2af-00155d0f1f01'

select --p.ChID,
		p.ProdName,p.UM, p.Article1, p.Notes, p.ProdID
		--,p.Country--, p.UID
		--, p.PCatID,p.PGrID, p.Article2 --,p.Article3, p.Weight,p.Age, p.PriceWithTax, p.Note1,p.Note2,p.Note3
		--,p.InRems, p.IsDecQty,p.InStopList,p.CstProdCode,p.TaxTypeID
		--,pmq.UM,pmq.BarCode, pip.PPID, pip.ProdDate
		, PriceMC=pmp1.PriceMC, /*pmp1.CurrID, pmp1.Notes,*/ PriceMC1=pmp2.PriceMC/*, pmp2.CurrID, pmp2.Notes*/
		,PersonsDiscount=pd.Discount--, pdt.PersonDiscountTypeName
		,dpd3.DocID DPD3DocID, dpd3.Discount DPD3Discount, dpd3.ParamL DPD3ParamL, dpd3.PLID DPD3PLID--, dpd3.BDate DPD3BDate, dpd3.EDate DPD3EDate
		,dpd6.DocID DPD6DocID, dpd6.Discount DPD6Discount, dpd6.ParamL DPD6ParamL, dpd6.PLID DPD6PLID
		,dpd9.DocID DPD9DocID, dpd9.Discount DPD9Discount, dpd9.ParamL DPD9ParamL, dpd9.PLID DPD9PLID
	from r_Prods p
	inner join r_ProdG3 pg3 on pg3.PGrID3=p.PGrID3	--select * from r_ProdG3
	left join r_ProdMQ pmq on pmq.ProdID=p.ProdID
	left join t_PInP pip on pip.ProdID=p.ProdID and pip.PPID=0
	left join r_ProdMP pmp1 on pmp1.ProdID=p.ProdID and pmp1.PLID=0
	left join r_ProdMP pmp2 on pmp2.ProdID=p.ProdID and pmp2.PLID=1
	left join ir_PersonsDiscounts pd on pd.PGrID3=p.PGrID3 and pd.PersonDiscountTypeID=5		--select * from ir_PersonsDiscounts
	left join ir_PersonDiscountTypes pdt on pdt.PersonDiscountTypeID=pd.PersonDiscountTypeID	--select * from ir_PersonDiscountTypes
	left join it_DiscPlanD dpd12 on dpd12.ProdID=p.ProdID and dpd12.DiscCode=12 and GETDATE()<=dpd12.EDate+' 23:59:59'
	left join it_DiscPlanD dpd3 on dpd3.ProdID=p.ProdID and dpd3.DiscCode=3 and GETDATE()<=dpd3.EDate+' 23:59:59'
	left join it_DiscPlanD dpd6 on dpd6.ProdID=p.ProdID and dpd6.DiscCode=6 and GETDATE()<=dpd6.EDate+' 23:59:59'
	left join it_DiscPlanD dpd9 on dpd9.ProdID=p.ProdID and dpd9.DiscCode=9 and GETDATE()<=dpd9.EDate+' 23:59:59'
	--select * from r_DCards where DCardID='2709000000017'--20850	
	--select d.DCardID, d.Notes, d.Note1, p.PersonName,p.PhoneHome, p.PersonDiscountTypeID, p.PLID from r_DCards d, r_Persons p, r_PersonDC pdc where d.DCardID='2709000000017' and pdc.PersonID=p.PersonID and pdc.DCardChID=d.ChID--37677--PersonDiscountTypeID=5--PLID-1
	--where pmp1.PriceMC<>pmp2.PriceMC	
		--and (dpd3.ProdID is Not NULL or dpd6.ProdID is Not NULL or dpd9.ProdID is Not NULL)	--and p.ProdID in (1023,1051,1052,1071)
		--p.Note3='983d2d11-34c0-11e4-a5db-003048d4490b'
	order by p.ProdID, pmq.Barcode

select dc.DCardID,dc.Notes,dc.Note1, p.PhoneHome,p.PLID,p.PersonDiscountTypeID from r_DCards dc,r_PersonDC pdc,r_Persons p where dc.DCardID='2709000000017' and pdc.DCardChID=dc.ChID and p.PersonID=pdc.PersonID