const PropertyRegistry = artifacts.require('PropertyRegistry');

contract('PropertyRegistry', (accounts) => {
    let propertyRegistryInstance;

    const owner = accounts[0];
    const propertyAddress = '120 Main St';
    const ownerName = 'Juan Perez';
    
    beforeEach(async () => {
        propertyRegistryInstance = await PropertyRegistry.new({ from: owner });
    });

    it('should register a new property', async () => {
        const receipt = await propertyRegistryInstance.registerProperty(propertyAddress, ownerName, { from: owner });

        // Check that the PropertyRegistered event was emitted
        assert.equal(receipt.logs.length, 1, 'PropertyRegistered event not emitted');
        const event = receipt.logs[0];
        assert.equal(event.event, 'PropertyRegistered', 'Event name is incorrect');
        const propertyId = event.args.id.toNumber();

        // Verify the property was stored correctly
        const property = await propertyRegistryInstance.getProperty(propertyId);
        assert.equal(property[2], propertyAddress, 'Property address does not match');
        assert.equal(property[3], ownerName, 'Owner name does not match');
        assert.equal(property[1], owner, 'Owner address does not match');
    });

    it('should retrieve the property by ID', async () => {
        const receipt = await propertyRegistryInstance.registerProperty(propertyAddress, ownerName, { from: owner });
        const propertyId = receipt.logs[0].args.id.toNumber();

        // Retrieve the property
        const property = await propertyRegistryInstance.getProperty(propertyId);

        // Verify the retrieved property
        assert.equal(property[0].toString(), propertyId.toString(), 'Property ID does not match');
        assert.equal(property[2], propertyAddress, 'Property address does not match');
        assert.equal(property[3], ownerName, 'Owner name does not match');
        assert.equal(property[1], owner, 'Owner address does not match');
    });

    it('should not transfer ownership of a non-existent property', async () => {
        try {
            await propertyRegistryInstance.transferOwnership(999, accounts[1], 'New Owner', { from: owner });
            assert.fail('Expected error not received');
        } catch (error) {
            assert(error.message.includes('Property does not exist'), 'Expected "Property does not exist" error');
        }
    });

    it('should only allow the owner to transfer ownership', async () => {
        const receipt = await propertyRegistryInstance.registerProperty(propertyAddress, ownerName, { from: owner });
        const propertyId = receipt.logs[0].args.id.toNumber();

        try {
            await propertyRegistryInstance.transferOwnership(propertyId, accounts[1], 'New Owner', { from: accounts[1] });
            assert.fail('Expected error not received');
        } catch (error) {
            assert(error.message.includes('Only the property owner can transfer ownership'), 'Expected "Only the property owner can transfer ownership" error');
        }
    });

    it('should transfer ownership of a property', async () => {
        const receipt = await propertyRegistryInstance.registerProperty(propertyAddress, ownerName, { from: owner });
        const propertyId = receipt.logs[0].args.id.toNumber();

        await propertyRegistryInstance.transferOwnership(propertyId, accounts[1], 'New Owner', { from: owner });

        const property = await propertyRegistryInstance.getProperty(propertyId);
        assert.equal(property[1], accounts[1], 'Owner address does not match');
        assert.equal(property[3], 'New Owner', 'Owner name does not match');
    });
});
