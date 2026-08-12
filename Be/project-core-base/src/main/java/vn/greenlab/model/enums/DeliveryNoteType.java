package vn.greenlab.model.enums;

public enum DeliveryNoteType {
    PKQ(1, "Trả KQXN")
    ;

    private final int delivery_note_type_id;
    private final String delivery_note_type_name;

    DeliveryNoteType(int delivery_note_type_id, String delivery_note_type_name) {
        this.delivery_note_type_id = delivery_note_type_id;
        this.delivery_note_type_name = delivery_note_type_name;
    }

    public int getDelivery_note_type_id() {
        return delivery_note_type_id;
    }

    public String getDelivery_note_type_name() {
        return delivery_note_type_name;
    }
}