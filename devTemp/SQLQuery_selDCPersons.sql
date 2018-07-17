--select * from r_DCards
--select * from r_Persons
select dc.DCardID,dc.Notes,dc.Note1, dc.UID DCUID, p.PersonName,p.PhoneHome,p.UID PersonUID, p.PLID,pl.PLName,p.PersonDiscountTypeID, pdt.PersonDiscountTypeName
from r_DCards dc
left join r_PersonDC pdc on pdc.DCardChID=dc.ChID 
left join r_Persons p on p.PersonID=pdc.PersonID
left join r_PLs pl on pl.PLID=p.PLID
left join ir_PersonDiscountTypes pdt on pdt.PersonDiscountTypeID=p.PersonDiscountTypeID
--where 
  --and dc.DCardID='2709000000017' 
/*
select pd.PersonDiscountTypeID,pdt.PersonDiscountTypeName,pd.PGrID3,pg3.PGrName3,pg3.PGOrder,pg3.lottery from ir_PersonsDiscounts pd,ir_PersonDiscountTypes pdt,r_ProdG3 pg3 where pdt.PersonDiscountTypeID=pd.PersonDiscountTypeID and pd.PGrID3=pg3.PGrID3
*/