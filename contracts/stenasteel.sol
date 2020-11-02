pragma solidity ^0.4.25;


contract stenasteel
{
    uint public decimals = 0;
    string public symbol = "STS";
    string public name = "Stena Steel";
    uint256 public totalSupply;
    mapping (address => uint) public balanceOf;
    mapping (bytes32 => string) public data;   

    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor(uint256 p0, string p1, string p2, string p3, string p4, string p5) public { 
        setData(p0, p1,p2,p3,p4,p5);
    }
    
    function setData(uint256 initialSupply, string SupplierName, string orderNumber,string chargeNumber,string Unit,string fileName) public 
    {
        totalSupply = initialSupply ;  
        balanceOf[msg.sender] = initialSupply;            
        data["SupplierName"] = SupplierName;
        data["orderNumber"] = orderNumber;
        data["chargeNumber"] = chargeNumber;
        data["Unit"] = Unit;
        data["fileName"] = fileName;
    }
    
    function getData() public view returns (string, string , string ,string,string ) 
    {
      return (data["SupplierName"],data["orderNumber"],data["chargeNumber"],data["Unit"],data["fileName"]);
    }
    
    function getmetadata() public view returns (  string , string,string,string ) 
    {
      return (
       data["Quality"],data["ReferenceNo"],data["UploadProductSpecification"],data["UploadQualityCertificate"]);
    }

    function transfer(uint256 _value, address customer) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value);   
        balanceOf[msg.sender] -= _value;    
        balanceOf[customer] += _value;       
        totalSupply -= _value;
        Transfer(msg.sender, customer, _value);                 
        return true;
    }

    function balanceOf(address _owner) constant returns (uint256) 
    {
      return balanceOf[_owner];
    }

    function totalSupply() constant returns (uint256 supply) 
    {
        return totalSupply;
    }
	
	function getExecutionid() constant returns (string)
    {
        return data["Executionid"];
    }
}

