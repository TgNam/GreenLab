package vn.greenlab.model.enums;

public enum CallState {
    CREATED(0, "Created"),
    SETUP(10, "Setup"),
    ERROR(20, "Error"),
    RINGING(30, "Ringing"),
    QUEUED(40, "Queued"),
    RINGING_WITH_EARLY_MEDIA(50, "RingingWithEarlyMedia"),
    FORWARDING(60, "Forwarding"),
    ANSWERED(70, "Answered"),
    NO_ANSWER(75, "NoAnswer"),
    LOCAL_HELD(80, "LocalHeld"),
    REMOTE_HELD(90, "RemoteHeld"),
    INACTIVE_HELD(100, "InactiveHeld"),
    TRANSFERRING(110, "Transferring"),
    IN_CALL(120, "InCall"),
    COMPLETED(130, "Completed"),
    REJECTED(140, "Rejected"),
    CANCELLED(150, "Cancelled"),
    BUSY(160, "Busy"),
    FORWARDED(170, "Forwarded");

    private final int id;
    private final String name;

    CallState(int id, String name) {
        this.id = id;
        this.name = name;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDbName() {
        return this.toString().replace("_", " ");
    }
}