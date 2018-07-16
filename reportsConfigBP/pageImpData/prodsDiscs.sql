select --p.ChID,
		p.ProdName,p.UM, p.Article1, p.Notes, p.ProdID, p.UID
		--,p.Country--
		--, p.PCatID,p.PGrID, p.Article2 --,p.Article3, p.Weight,p.Age, p.PriceWithTax, p.Note1,p.Note2,p.Note3
		--,p.InRems, p.IsDecQty,p.InStopList,p.CstProdCode,p.TaxTypeID
		,pmq.BarCode,pmq.UM BCUM	--, pip.PPID, pip.ProdDate
		, PriceMC=pmp1.PriceMC, /*pmp1.CurrID, pmp1.Notes,*/ PriceMC1=pmp2.PriceMC/*, pmp2.CurrID, pmp2.Notes*/
		,dpd.DiscCode,dss.DiscName, dpd.DocID DPDDocID, dpd.Discount DPDDiscount, dpd.ParamL DPDParamL, dpd.PLID DPDPLID--, dpd3.BDate DPD3BDate, dpd3.EDate DPD3EDate
		,convert(varchar(20),dpd.DiscCode)+'_'+ISNULL(convert(varchar(20),dpd.DocID),'_')+'_'+ISNULL(convert(varchar(20),dpd.PLID),'_') DPDID
		--,dpd.ChID
	from r_Prods p
	inner join r_ProdG3 pg3 on pg3.PGrID3=p.PGrID3	--select * from r_ProdG3
	left join r_ProdMQ pmq on pmq.ProdID=p.ProdID
	left join t_PInP pip on pip.ProdID=p.ProdID and pip.PPID=0
	left join r_ProdMP pmp1 on pmp1.ProdID=p.ProdID and pmp1.PLID=0
	left join r_ProdMP pmp2 on pmp2.ProdID=p.ProdID and pmp2.PLID=1
	left join it_DiscPlanD dpd on dpd.ProdID=p.ProdID and GETDATE()<=dpd.EDate+' 23:59:59'
	left join r_Discs dss on dss.DiscCode=dpd.DiscCode
	where p.prodID>0
		--and (dpd3.ProdID is Not NULL or dpd6.ProdID is Not NULL or dpd9.ProdID is Not NULL)	--and p.ProdID in (1023,1051,1052,1071)
		--p.Note3='983d2d11-34c0-11e4-a5db-003048d4490b'
	order by p.ProdID, pmq.Barcode