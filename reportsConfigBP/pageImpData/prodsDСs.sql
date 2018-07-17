select dc.DCardID,dc.Notes,dc.Note1, dc.UID DCUID, p.PersonName,p.PhoneHome,p.UID PersonUID, p.PLID,pl.PLName,p.PersonDiscountTypeID, pdt.PersonDiscountTypeName
from r_DCards dc
left join r_PersonDC pdc on pdc.DCardChID=dc.ChID 
left join r_Persons p on p.PersonID=pdc.PersonID
left join r_PLs pl on pl.PLID=p.PLID
left join ir_PersonDiscountTypes pdt on pdt.PersonDiscountTypeID=p.PersonDiscountTypeID
where @OnlyWithPersons=0 or (@OnlyWithPersons=1 and pdc.PersonID is Not NULL) or (@OnlyWithPersons=-1 and pdc.PersonID is NULL)
