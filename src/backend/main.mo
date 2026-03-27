import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Migration "migration";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Use migration for persistent actors
(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserRole = AccessControl.UserRole;

  public type UserProfile = {
    name : Text;
    role : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management (Required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      return null;
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot save profiles");
    };
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Payroll Management Types
  public type Executive = {
    id : Nat;
    name : Text;
    username : Text;
    password : Text;
  };

  public type ProfitRecord = {
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

  public type Session = {
    token : Text;
    principal : Principal;
    username : Text;
    role : Text;
    createdAt : Int;
  };

  // Admin credentials
  var adminUsername = "admin";
  var adminPassword = "admin123";

  // Profit Management State
  var nextExecutiveId = 1;
  var nextRecordId = 1;
  var nextSessionId = 1;
  let executivesByUsername = Map.empty<Text, Nat>();
  let sessions = Map.empty<Text, Session>();
  let profitRecords = Map.empty<Nat, ProfitRecord>();
  let executiveDirectory = Map.empty<Nat, Executive>();
  let sessionsByPrincipal = Map.empty<Principal, [Text]>();

  // Session Management
  func generateSessionToken(id : Nat) : Text {
    "session_" # id.toText() # "_" # Int.toText(Time.now())
  };

  func getSession(token : Text) : ?Session {
    sessions.get(token);
  };

  func validateSessionToken(token : Text) : ?(Text, Text) {
    switch (getSession(token)) {
      case (?session) { ?(session.username, session.role) };
      case (null) { null };
    };
  };

  func invalidateUserSessions(username : Text) {
    let sessionsToRemove = Map.empty<Text, Bool>();
    for ((token, session) in sessions.entries()) {
      if (session.username == username) {
        sessionsToRemove.add(token, true);
      };
    };
    for ((token, _) in sessionsToRemove.entries()) {
      sessions.remove(token);
    };
  };

  func invalidateAllSessions() {
    for ((token, _) in sessions.entries()) {
      sessions.remove(token);
    };
  };

  // Authentication
  public shared ({ caller }) func login(username : Text, password : Text) : async { token : Text; role : Text } {
    let role : Text = if (username == adminUsername and password == adminPassword) {
      "admin";
    } else {
      switch (executivesByUsername.get(username)) {
        case (?execId) {
          switch (executiveDirectory.get(execId)) {
            case (?exec) {
              if (exec.password == password) {
                "executive";
              } else {
                Runtime.trap("Invalid credentials");
              };
            };
            case (null) {
              Runtime.trap("Invalid credentials");
            };
          };
        };
        case (null) {
          Runtime.trap("Invalid credentials");
        };
      };
    };

    let token = generateSessionToken(nextSessionId);
    nextSessionId += 1;

    let session : Session = {
      token = token;
      principal = caller;
      username = username;
      role = role;
      createdAt = Time.now();
    };

    sessions.add(token, session);

    // Track sessions by principal
    switch (sessionsByPrincipal.get(caller)) {
      case (?existingTokens) {
        sessionsByPrincipal.add(caller, existingTokens.concat([token]));
      };
      case (null) {
        sessionsByPrincipal.add(caller, [token]);
      };
    };

    { token = token; role = role };
  };

  public shared ({ caller }) func validateSession(token : Text) : async { username : Text; role : Text } {
    switch (validateSessionToken(token)) {
      case (?(username, role)) {
        { username = username; role = role };
      };
      case (null) {
        Runtime.trap("Invalid session token");
      };
    };
  };

  public shared ({ caller }) func logout(token : Text) : async () {
    switch (getSession(token)) {
      case (?session) {
        if (session.principal != caller) {
          Runtime.trap("Unauthorized: Cannot logout another user's session");
        };
        sessions.remove(token);
      };
      case (null) {
        Runtime.trap("Session not found");
      };
    };
  };

  // Password Management
  public shared ({ caller }) func changeAdminPassword(token : Text, oldPassword : Text, newPassword : Text) : async () {
    switch (validateSessionToken(token)) {
      case (?(username, "admin")) {
        if (username != adminUsername) {
          Runtime.trap("Unauthorized: Only admin can change admin password");
        };
        if (oldPassword != adminPassword) {
          Runtime.trap("Invalid old password");
        };
        adminPassword := newPassword;
        invalidateAllSessions();
      };
      case (_) {
        Runtime.trap("Unauthorized: Only admin can change admin password");
      };
    };
  };

  public shared ({ caller }) func changeExecutivePassword(token : Text, username : Text, newPassword : Text) : async () {
    switch (validateSessionToken(token)) {
      case (?(sessionUsername, sessionRole)) {
        // Admin can change any executive password, executive can change their own
        if (sessionRole != "admin" and sessionUsername != username) {
          Runtime.trap("Unauthorized: Can only change your own password");
        };

        switch (executivesByUsername.get(username)) {
          case (?execId) {
            switch (executiveDirectory.get(execId)) {
              case (?exec) {
                let updatedExec : Executive = {
                  exec with password = newPassword
                };
                executiveDirectory.add(execId, updatedExec);
                invalidateUserSessions(username);
              };
              case (null) {
                Runtime.trap("Executive not found");
              };
            };
          };
          case (null) {
            Runtime.trap("Executive not found");
          };
        };
      };
      case (null) {
        Runtime.trap("Invalid session token");
      };
    };
  };

  // Executive Management (Admin only)
  public shared ({ caller }) func addExecutive(token : Text, name : Text, username : Text, password : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add executives");
    };

    switch (validateSessionToken(token)) {
      case (?(_, "admin")) {
        if (executivesByUsername.containsKey(username)) {
          Runtime.trap("Executive with username already exists");
        };

        let id = nextExecutiveId;
        nextExecutiveId += 1;

        let executive : Executive = {
          id = id;
          name = name;
          username = username;
          password = password;
        };

        executiveDirectory.add(id, executive);
        executivesByUsername.add(username, id);
        id;
      };
      case (_) {
        Runtime.trap("Unauthorized: Only admin can add executives");
      };
    };
  };

  public shared ({ caller }) func deleteExecutive(token : Text, executiveId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete executives");
    };

    switch (validateSessionToken(token)) {
      case (?(_, "admin")) {
        switch (executiveDirectory.get(executiveId)) {
          case (?exec) {
            executivesByUsername.remove(exec.username);
            executiveDirectory.remove(executiveId);
            invalidateUserSessions(exec.username);
          };
          case (null) {
            Runtime.trap("Executive not found");
          };
        };
      };
      case (_) {
        Runtime.trap("Unauthorized: Only admin can delete executives");
      };
    };
  };

  public query ({ caller }) func listExecutives(token : Text) : async [Executive] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list executives");
    };

    switch (validateSessionToken(token)) {
      case (?(_, "admin")) {
        let execsIter = executiveDirectory.values();
        execsIter.toArray();
      };
      case (_) {
        Runtime.trap("Unauthorized: Only admin can list executives");
      };
    };
  };

  public query ({ caller }) func getExecutive(token : Text, id : Nat) : async ?Executive {
    switch (validateSessionToken(token)) {
      case (?_) {
        executiveDirectory.get(id);
      };
      case (null) {
        Runtime.trap("Invalid session token");
      };
    };
  };

  // Profit Record CRUD
  func getNextProfitRecordId() : Nat {
    let id = nextRecordId;
    nextRecordId += 1;
    id;
  };

  public shared ({ caller }) func addRecord(token : Text, date : Text, customerName : Text, amountReceived : Float, dailyTarget : Float, customerDailyTarget : Float, customerTotalReceived : Float, executiveName : Text) : async Nat {
    switch (validateSessionToken(token)) {
      case (?(username, role)) {
        let id = getNextProfitRecordId();
        let newRecord : ProfitRecord = {
          id = id;
          date = date;
          customerName = customerName;
          amountReceived = amountReceived;
          dailyTarget = dailyTarget;
          customerDailyTarget = customerDailyTarget;
          customerTotalReceived = customerTotalReceived;
          executiveName = executiveName;
          addedBy = username;
          createdAt = Time.now();
        };
        profitRecords.add(id, newRecord);
        id;
      };
      case (null) {
        Runtime.trap("Invalid session token");
      };
    };
  };

  public shared ({ caller }) func updateRecord(token : Text, recordId : Nat, date : Text, customerName : Text, amountReceived : Float, dailyTarget : Float, customerDailyTarget : Float, customerTotalReceived : Float, executiveName : Text) : async () {
    switch (validateSessionToken(token)) {
      case (?(username, role)) {
        switch (profitRecords.get(recordId)) {
          case (?existingRecord) {
            let updatedRecord : ProfitRecord = {
              id = recordId;
              date = date;
              customerName = customerName;
              amountReceived = amountReceived;
              dailyTarget = dailyTarget;
              customerDailyTarget = customerDailyTarget;
              customerTotalReceived = customerTotalReceived;
              executiveName = executiveName;
              addedBy = existingRecord.addedBy;
              createdAt = existingRecord.createdAt;
            };
            profitRecords.add(recordId, updatedRecord);

            // Auto-update dailyTarget for all records with same executiveName
            if (existingRecord.executiveName == executiveName and existingRecord.dailyTarget != dailyTarget) {
              for ((id, record) in profitRecords.entries()) {
                if (record.executiveName == executiveName and id != recordId) {
                  let autoUpdatedRecord : ProfitRecord = {
                    record with dailyTarget = dailyTarget
                  };
                  profitRecords.add(id, autoUpdatedRecord);
                };
              };
            };
          };
          case (null) {
            Runtime.trap("Profit record not found");
          };
        };
      };
      case (null) {
        Runtime.trap("Invalid session token");
      };
    };
  };

  public shared ({ caller }) func deleteRecord(token : Text, recordId : Nat) : async () {
    switch (validateSessionToken(token)) {
      case (?(username, role)) {
        if (not profitRecords.containsKey(recordId)) {
          Runtime.trap("Profit record not found");
        };
        profitRecords.remove(recordId);
      };
      case (null) {
        Runtime.trap("Invalid session token");
      };
    };
  };

  public query ({ caller }) func listAllRecords(token : Text) : async [ProfitRecord] {
    switch (validateSessionToken(token)) {
      case (?_) {
        let recordsIter = profitRecords.values();
        recordsIter.toArray();
      };
      case (null) {
        Runtime.trap("Invalid session token");
      };
    };
  };

  public query ({ caller }) func listRecordsByMonth(token : Text, month : Nat, year : Nat) : async [ProfitRecord] {
    switch (validateSessionToken(token)) {
      case (?_) {
        let monthStr = if (month < 10) { "0" # month.toText() } else { month.toText() };
        let yearStr = year.toText();
        let prefix = yearStr # "-" # monthStr;

        let filtered = profitRecords.values().toArray().filter(
          func(record : ProfitRecord) : Bool {
            record.date.startsWith(#text prefix);
          }
        );
        filtered;
      };
      case (null) {
        Runtime.trap("Invalid session token");
      };
    };
  };

  public query ({ caller }) func listRecordsByExecutive(token : Text, executiveName : Text) : async [ProfitRecord] {
    switch (validateSessionToken(token)) {
      case (?_) {
        let filtered = profitRecords.values().toArray().filter(
          func(record : ProfitRecord) : Bool {
            record.executiveName == executiveName;
          }
        );
        filtered;
      };
      case (null) {
        Runtime.trap("Invalid session token");
      };
    };
  };
};
