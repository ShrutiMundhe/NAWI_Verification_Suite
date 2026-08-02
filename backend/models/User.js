import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    idNumber: {
      type: String,
      required: [true, "Official Inspector ID Number is required"],
      trim: true
    },
    credentials: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user"
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    approved: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

UserSchema.pre("save", function (next) {
  if (!this.credentials) {
    this.credentials = this.idNumber;
  }
  this.approved = this.status === "approved" || this.role === "admin";
  this.active = this.status !== "rejected";
  next();
});

UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  user.id = user._id;
  user.approved = user.status === "approved" || user.role === "admin";
  user.active = user.status !== "rejected";
  return user;
};

const User = mongoose.model("User", UserSchema);
export default User;
