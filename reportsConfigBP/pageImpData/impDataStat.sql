select CurDate=@CDATE, ObjName, SUM(ErrCount) ErrCount,SUM(ZCount) ZCount,SUM(ACount) ACount from (
	select ObjName, count(1) ErrCount, ZCount=0, ACount=0
	from iz_DataImport 
	where State<0 and CreateDate between CONVERT(datetime,@CDATE+' 00:00:00') and CONVERT(datetime,@CDATE+' 23:59:59')
	group by ObjName
	union all
	select ObjName, ErrCount=0, count(1) ZCount, ACount=0
	from iz_DataImport 
	where State=0 and CreateDate between CONVERT(datetime,@CDATE+' 00:00:00') and CONVERT(datetime,@CDATE+' 23:59:59')
	group by ObjName	
	union all
	select ObjName, ErrCount=0, ZCount=0, count(1) ACount
	from iz_DataImport 
	where State>0 and CreateDate between CONVERT(datetime,@CDATE+' 00:00:00') and CONVERT(datetime,@CDATE+' 23:59:59')
	group by ObjName	
) m group by ObjName order by ObjName
