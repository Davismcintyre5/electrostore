const ContactPage = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Contact Us</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-700 mb-4">
          We'd love to hear from you! Fill out the form below and we'll get back to you as soon as possible.
        </p>
        <form>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input type="text" className="w-full p-2 border rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className="w-full p-2 border rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea rows="5" className="w-full p-2 border rounded" required></textarea>
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">
            Send Message
          </button>
        </form>
        <div className="mt-8 border-t pt-6">
          <h2 className="font-semibold mb-2">Other ways to reach us</h2>
          <p className="text-gray-600">Email: support@electrostore.com</p>
          <p className="text-gray-600">Phone: +254 700 123 456</p>
          <p className="text-gray-600">Address: Nairobi, Kenya</p>
        </div>
      </div>
    </div>
  )
}

export default ContactPage