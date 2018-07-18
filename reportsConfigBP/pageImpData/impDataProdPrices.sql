   select * from iz_DataImport 
   where ObjName='DocProductSalePriceDTL'
      and CreateDate between convert(datetime, @CDATE+' 00:00:00') and convert(datetime, @CDATE+' 23:59:59') 
      and (@State='all' or (@State='-1' and State<0) or (@State='0' and State=0) or (@State='1' and State>0))
