import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    password_hash: {
      type: String,
      required: [true, "Password hash is required"],
      minlength: 60,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    department: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    last_login: {
      type: Date,
    },
  },
  {
    versionKey: false,
  }
);

// Pre-save hook to hash password before saving
UserSchema.pre("save", async function (next) {
  const user = this;

  // Only hash the password if it has been modified or is new
  if (!user.isModified("password_hash")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password_hash, salt);
    user.password_hash = hash;
    next();
  } catch (error) {
    next(error);
  }
});

// Compare candidate password with the stored password hash
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Exclude password_hash when converting user document to JSON
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password_hash;
  return obj;
};

const User = mongoose.model("User", UserSchema);
export default User;
