// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PropertyRegistry {
    struct Property {
        uint id;
        string propertyAddress;
        string ownerName;
        address owner;
    }

    uint public propertyCount;
    mapping(uint => Property) public properties;

    event PropertyRegistered(uint id, string propertyAddress, string ownerName, address owner);
    event OwnershipTransferred(uint id, string newOwnerName, address newOwner);

    function registerProperty(string memory _propertyAddress, string memory _ownerName) public {
        propertyCount++;
        properties[propertyCount] = Property(propertyCount, _propertyAddress, _ownerName, msg.sender);
        emit PropertyRegistered(propertyCount, _propertyAddress, _ownerName, msg.sender);
    }

    function transferOwnership(uint _propertyId, address _newOwner, string memory _newOwnerName) public {
        Property memory property = properties[_propertyId];
        require(property.owner == msg.sender, "Only the owner can transfer the property");
        properties[_propertyId].owner = _newOwner;
        properties[_propertyId].ownerName = _newOwnerName;
        emit OwnershipTransferred(_propertyId, _newOwnerName, _newOwner);
    }

    function getProperty(uint _propertyId) public view returns (uint, string memory, string memory, address) {
        Property memory property = properties[_propertyId];
        return (property.id, property.propertyAddress, property.ownerName, property.owner);
    }

    function getAllProperties() public view returns (Property[] memory) {
        Property[] memory allProperties = new Property[](propertyCount);
        for (uint i = 1; i <= propertyCount; i++) {
            allProperties[i - 1] = properties[i];
        }
        return allProperties;
    }
}


