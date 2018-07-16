   select di.*, divName.DataVal as NameAkc
   from iz_DataImport di
   left join iz_DataImportValues divName on divName.CHID=di.CHID and divName.DataName='NameAkc'
   where CreateDate between convert(datetime, @CDATE+' 00:00:00') and convert(datetime, @CDATE+' 23:59:59') and ObjName='AKCIYA'
