describe('bfriendr back end', function() {
  var capServer;
  var generateAccountRunner;
  
  var asCap = function(c) {
    if (c.length == 0) throw('asCap passed an empty string');
    if (! (/^https?:\/\//).test(c)) {
      console.log(c); // keep
      throw('asCap not a URL: ' + c);
    }
    return capServer.restore(c);
  };
  
  beforeEach(function() {
    capServer = new CapServer();
    generateAccountRunner =
      mkRunner(capServer.restore("http://localhost:9009/generate-account"));
  });
  
  describe('basic account operations', function() {
    var accountRunner;
    
    beforeEach(function() {
      accountRunner = new InvokeRunner();

      generateAccountRunner.runsGet();
      generateAccountRunner.runsExpectSuccess();
      runs(function() {
        accountRunner.cap = asCap(generateAccountRunner.result);
        expect(accountRunner.cap).toBeDefined();
      });
    });

    afterEach(function() {
      accountRunner.runsDelete();
      accountRunner.runsExpectSuccess();
    });
    
    it('should generate & delete a new account', function() {
      // the beforeEach and afterEach do this test
    });

    it('should save and restore my card info', function() {
      var myCardRunner = new InvokeRunner();
      var initialCard, updatedCard;
      
      accountRunner.runsGet();
      accountRunner.runsExpectSuccess();

      runs(function() {
        myCardRunner.cap = asCap(accountRunner.result.myCard);
        expect(myCardRunner.cap).toBeDefined();
      })
      
      myCardRunner.runsGet();
      myCardRunner.runsExpectSuccess();
      runs(function() {
        initialCard = myCardRunner.result;
        expect(typeof initialCard.name).toEqual('string');
        expect(initialCard.name).not.toEqual('');
        expect(typeof initialCard.email).toEqual('string');
        expect(initialCard.email).not.toEqual('');
        expect(typeof initialCard.notes).toEqual('string');
        expect(initialCard.notes).not.toEqual('');
      });
      
      myCardRunner.runsPut(
        { name: 'fido', email: 'fido@example.com', notes: 'not a dog'});
      myCardRunner.runsExpectSuccess();
      myCardRunner.runsGet();
      myCardRunner.runsExpectSuccess();
      runs(function() {
        updatedCard = myCardRunner.result;
        expect(updatedCard.name).toEqual('fido');
        expect(updatedCard.email).toEqual('fido@example.com');
        expect(updatedCard.notes).toEqual('not a dog');
      });
    });
  });

  describe('account introduction', function() {
    var account1CapRunner;
    var account2CapRunner;
    var account1CardRunner;
    var account2CardRunner;
    var account1Card;
    var account2Card;
    var account2IntroduceRunner;
    
    beforeEach(function() {
      account1CapRunner = new InvokeRunner();
      account2CapRunner = new InvokeRunner();
      account1CardRunner = new InvokeRunner();
      account2CardRunner = new InvokeRunner();
      account1Card, account2Card;
      account2IntroduceRunner = new InvokeRunner();
    
      generateAccountRunner.runsGet();
      generateAccountRunner.runsExpectSuccess();
      runs(function() { 
        account1CapRunner.cap = asCap(generateAccountRunner.result);
        expect(account1CapRunner.cap).toBeDefined();
      });

      generateAccountRunner.runsGet();
      generateAccountRunner.runsExpectSuccess();
      runs(function() { 
        account2CapRunner.cap = asCap(generateAccountRunner.result); 
        expect(account2CapRunner.cap).toBeDefined();
      });
    
      account1CapRunner.runsGet();
      account1CapRunner.runsExpectSuccess();
      runs(function() {
        account1CardRunner.cap = asCap(account1CapRunner.result.myCard);
        expect(account1CardRunner.cap).toBeDefined();
      });
    
      account2CapRunner.runsGet();
      account2CapRunner.runsExpectSuccess();
      runs(function() {
        account2CardRunner.cap = asCap(account2CapRunner.result.myCard);
        expect(account2CardRunner.cap).toBeDefined();
      });
      
      account1CardRunner.runsPut({ name: 'One', email: 'one@example.com',
        notes: 'nan' });
      account1CardRunner.runsExpectSuccess();
        
      account2CardRunner.runsPut({ name: 'Two', email: 'two@example.com',
        notes: 'nan' });
      account2CardRunner.runsExpectSuccess();
      
      account1CardRunner.runsGet();
      account1CardRunner.runsExpectSuccess();
      runs(function() {
        account1Card = account1CardRunner.result;
        expect(account1Card.name == 'One');
      });

      account2CardRunner.runsGet();
      account2CardRunner.runsExpectSuccess();
      runs(function() {
        account2Card = account2CardRunner.result;
        expect(account1Card.name == 'Two');
      });
    });

    afterEach(function() {
      account1CapRunner.runsDelete();
      account1CapRunner.runsExpectSuccess();
      account2CapRunner.runsDelete();
      account2CapRunner.runsExpectSuccess();
    })

    it('should get the card from an introduction cap', function() {
      var account2IntroduceRunner = new InvokeRunner();
      
      account2IntroduceRunner.cap = 
        asCap(account2CapRunner.result.introduceYourself);
      expect(account2IntroduceRunner.cap).toBeDefined();
      // Account 1 is doing this call to determine who account 2 is
      account2IntroduceRunner.runsGet();
      account2IntroduceRunner.runsExpectSuccess();
      runs(function() {
        expect(account2IntroduceRunner.result.name).toEqual(account2Card.name);
      });
    });

    it('should let 1 introduce itself to 2', function() {
      var account2IntroduceRunner = new InvokeRunner();
      
      account2IntroduceRunner.cap = 
        asCap(account2CapRunner.result.introduceYourself);
      expect(account2IntroduceRunner.cap).toBeDefined();

      account2IntroduceRunner.runsPost({card: account1Card,
                                        stream: "Account 1 stream"});
      account2IntroduceRunner.runsExpectSuccess();
      runs(function() {
        var bCard = account2IntroduceRunner.result.card;
        expect(bCard.name).toEqual(account2Card.name);
      });

    }); 

    it('should introduce 1 to 2 via introduceMeTo', function() {
      // TODO(jpolitz): backend currently expects a URL, should expect cap
      var account2Introduce = account2CapRunner.result.introduceYourself;

      var intro1to2Runner = new InvokeRunner();
      intro1to2Runner.cap = asCap(account1CapRunner.result.introduceMeTo);
      intro1to2Runner.runsPost({introductionCap: account2Introduce});
      runs(function() {
        var bCard = intro1to2Runner.result.card;
        expect(bCard.name).toEqual(account2Card.name);
        // TODO(jpolitz): test that account 2 has a new friend
      });

    })

  });


});
