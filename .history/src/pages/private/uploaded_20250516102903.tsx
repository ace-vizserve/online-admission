import Profile from "@/components/private/student-profile/profile";

function Uploaded() {

  if (!params.id) {
    return <h1>Student number is not defined!</h1>;
  }

  return (
    <>
      <div className="py-7 md:py-14 px-4 md:px-6">
        <Profile studentID={params.id} />
      </div>
    </>
  );
}

export default Uploaded;
