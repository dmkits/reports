declare @CDATE datetime='20180710'
select ObjName, SUM(ErrCount) ErrCount,SUM(ZCount) ZCount,SUM(ACount) ACount from (
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

/*
declare @CDATE datetime='20180710', @ObjName varchar(200)='DiscountCard'
select ObjName, MINCreateDate,MAXCreateDate,
	CASE State When -1 Then 'ERRORS' When 0 Then 'Not Applied' When 1 Then 'Applied' Else 'UNKNOWN' END StateName
from (
	select ObjName, State=-1, count(1) Count, MIN(CreateDate) MINCreateDate,MAX(CreateDate) MAXCreateDate
	from iz_DataImport 
	where ObjName=@ObjName and State<0 and CreateDate between CONVERT(datetime,@CDATE+' 00:00:00') and CONVERT(datetime,@CDATE+' 23:59:59')
	group by ObjName
	union all
	select ObjName, State=0, count(1) Count, MIN(CreateDate) MINCreateDate,MAX(CreateDate) MAXCreateDate
	from iz_DataImport 
	where ObjName=@ObjName and State=0 and CreateDate between CONVERT(datetime,@CDATE+' 00:00:00') and CONVERT(datetime,@CDATE+' 23:59:59')
	group by ObjName	
	union all
	select ObjName, State=1, count(1) Count, MIN(CreateDate) MINCreateDate,MAX(CreateDate) MAXCreateDate
	from iz_DataImport 
	where ObjName=@ObjName and State>0 and CreateDate between CONVERT(datetime,@CDATE+' 00:00:00') and CONVERT(datetime,@CDATE+' 23:59:59')
	group by ObjName	
	union all
	select ObjName, State=NULL, count(1) Count, MIN(CreateDate) MINCreateDate,MAX(CreateDate) MAXCreateDate
	from iz_DataImport 
	where ObjName=@ObjName and State is NULL and CreateDate between CONVERT(datetime,@CDATE+' 00:00:00') and CONVERT(datetime,@CDATE+' 23:59:59')
	group by ObjName	
) m order by ObjName
*/