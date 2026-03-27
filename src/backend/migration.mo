import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Iter "mo:core/Iter";

module {
  public type OldExecutive = {
    id : Nat;
    name : Text;
    username : Text;
    password : Text;
  };

  public type OldProfitRecord = {
    id : Nat;
    date : Text;
    customerName : Text;
    amountReceived : Float;
    dailyTarget : Float;
    executiveName : Text;
    addedBy : Text;
    createdAt : Int;
  };

  public type OldSession = {
    token : Text;
    principal : Principal;
    username : Text;
    role : Text;
    createdAt : Int;
  };

  public type OldActor = {
    nextExecutiveId : Nat;
    nextRecordId : Nat;
    nextSessionId : Nat;
    executivesByUsername : Map.Map<Text, Nat>;
    sessions : Map.Map<Text, OldSession>;
    profitRecords : Map.Map<Nat, OldProfitRecord>;
  };

  public type NewExecutive = {
    id : Nat;
    name : Text;
    username : Text;
    password : Text;
  };

  public type NewProfitRecord = {
    id : Nat;
    date : Text;
    customerName : Text;
    amountReceived : Float;
    dailyTarget : Float;
    customerDailyTarget : Float;
    customerTotalReceived : Float;
    executiveName : Text;
    addedBy : Text;
    createdAt : Int;
  };
  public type NewSession = OldSession;

  public type NewActor = {
    nextExecutiveId : Nat;
    nextRecordId : Nat;
    nextSessionId : Nat;
    executivesByUsername : Map.Map<Text, Nat>;
    sessions : Map.Map<Text, NewSession>;
    profitRecords : Map.Map<Nat, NewProfitRecord>;
    executiveDirectory : Map.Map<Nat, NewExecutive>;
    sessionsByPrincipal : Map.Map<Principal, [Text]>;
  };

  public func run(old : OldActor) : NewActor {
    {
      nextExecutiveId = old.nextExecutiveId;
      nextRecordId = old.nextRecordId;
      nextSessionId = old.nextSessionId;
      executivesByUsername = old.executivesByUsername;
      sessions = old.sessions;
      profitRecords = old.profitRecords.map(
        func(_id, oldRecord) {
          {
            oldRecord with
            customerDailyTarget = 0.0;
            customerTotalReceived = 0.0;
          };
        }
      );
      executiveDirectory = Map.empty<Nat, NewExecutive>();
      sessionsByPrincipal = Map.empty<Principal, [Text]>();
    };
  };
};
