   select di.*, divName.DataVal as NameAkc
   from iz_DataImport di
   left join iz_DataImportValues divName on divName.CHID=di.CHID and divName.DataName='NameAkc'
   where di.ObjName='AKCIYA'
      and di.CreateDate between convert(datetime, @CDATE+' 00:00:00') and convert(datetime, @CDATE+' 23:59:59') 
      and (@State='all' or (@State='-1' and di.State<0) or (@State='0' and di.State=0) or (@State='1' and di.State>0))
